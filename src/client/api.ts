/**
 * Browser-side data access for the thinking-intensity panel — the only path
 * the UI reads/writes harness state through. Uses the session wire API
 * (model directory + selection) and the settings API (llm-pi-ai document),
 * the same seams the shipped settings Models page uses; no host RPC, no
 * harness, no custom routes.
 */

import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import type { SettingsPathOpView, SettingsNamespaceView } from '@deepseek-ai/dsh-client-connection/client'
import type { SessionId } from '@deepseek-ai/dsh-client-connection/client'
import type { ModelSelection, SessionModels } from '@deepseek-ai/dsh-client-connection/client'
import { BUDGET_LEVELS, LEVELS } from './presets.ts'
import type { BudgetRows, CompatView, MappingView, SavePayload } from './draft.ts'

/** Settings namespace hosting the llm-pi-ai provider profiles. */
const SETTINGS_NS = 'llm-pi-ai'

/** The agent-default-model settings namespace (current selection lives here). */
const DEFAULT_MODEL_NS = 'agent-default-model'

/** Error carrying a user-readable failure text. */
export class PanelError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PanelError'
  }
}

/** Unwrap an RpcResult, throwing a PanelError on failure. */
function unwrap<T>(label: string, response: { result: { ok: boolean; value?: T; error?: unknown } }): T {
  if (!response.result.ok) {
    const raw = response.result.error
    const text = typeof raw === 'object' && raw !== null && typeof (raw as { message?: unknown }).message === 'string'
      ? (raw as { message: string }).message
      : String(raw ?? 'unknown error')
    throw new PanelError(`${label}: ${text}`)
  }
  return response.result.value as T
}

/** One model entry inside a provider group. */
export interface ModelItem {
  provider: string
  id: string
  name: string
  efforts: Array<{ id: string; name: string }>
  hasReasoning: boolean
  defaultEffort: string | null
}

/** The full panel data view: provider groups + current selection. */
export interface DirectoryView {
  groups: Array<{ provider: string; name: string; models: ModelItem[] }>
  current: ModelSelection | null
}

/** One model's full config view (directory + settings document). */
export interface ConfigView {
  provider: string
  model: string
  modelName: string
  isCurrent: boolean
  currentEffort: string | null
  efforts: Array<{ id: string; name: string }>
  hasReasoning: boolean
  defaultEffort: string | null
  error: string | null
  mapping: MappingView | null
  compat: CompatView
  budgets: BudgetRows[] | null
  canSave: boolean
  revision: number | null
}

/**
 * API facade over the session wire + settings wire APIs.
 * `connection` is the injected connection handle (task-board pattern).
 */
export class IntensityApi {
  constructor(private readonly connection: ConnectionHandle) {}

  /** Resolve the session used for model-directory calls (caller-supplied fallback). */
  async directory(sessionId: SessionId): Promise<DirectoryView> {
    const models = unwrap<SessionModels>('models', await this.connection.api.sessions.models({ sessionId }))
    const groups = models.groups.map((group) => ({
      provider: group.id,
      name: group.name,
      models: group.models.map((model) => ({
        provider: group.id,
        id: model.id,
        name: model.name,
        efforts: (model.reasoning?.efforts ?? []).map((e) => ({ id: e.id, name: e.name })),
        hasReasoning: model.reasoning !== undefined && model.reasoning !== null,
        defaultEffort: model.reasoning?.defaultEffort ?? null,
      })),
    }))
    return { groups, current: models.current ?? null }
  }

  /** Describe the settings document; returns the llm-pi-ai namespace view when registered. */
  async llmPiAiNamespace(): Promise<{ view: SettingsNamespaceView; writable: boolean } | null> {
    const desc = unwrap<{ writable: boolean; hasDocument: boolean; namespaces: SettingsNamespaceView[] }>(
      'settings.describe',
      await this.connection.api.settings.describe({}),
    )
    const hit = desc.namespaces.find((ns) => ns.ns === SETTINGS_NS)
    if (hit === undefined) return null
    return { view: hit, writable: desc.writable }
  }

  /**
   * Build the full config view for one provider/model from the directory +
   * settings document.
   */
  async config(sessionId: SessionId, provider: string, model: string): Promise<ConfigView> {
    const dir = await this.directory(sessionId)
    const current = dir.current
    const isCurrent = current !== null && current.provider === provider && current.model === model
    let item: ModelItem | undefined
    for (const group of dir.groups) {
      const hit = group.models.find((m) => m.provider === provider && m.id === model)
      if (hit !== undefined) {
        item = hit
        break
      }
    }
    const view: ConfigView = {
      provider,
      model,
      modelName: item?.name ?? model,
      isCurrent,
      currentEffort: isCurrent ? (current?.reasoningEffort ?? null) : null,
      efforts: item?.efforts ?? [],
      hasReasoning: item?.hasReasoning ?? false,
      defaultEffort: item?.defaultEffort ?? null,
      error: item === undefined ? '该模型不在当前目录中' : null,
      mapping: null,
      compat: { thinkingFormat: null, supportsReasoningEffort: null },
      budgets: null,
      canSave: false,
      revision: null,
    }
    const ns = await this.llmPiAiNamespace()
    if (ns === null) return view
    view.canSave = ns.writable
    view.revision = ns.view.revision
    const value = ns.view.value as unknown
    const providers = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
    const profile = providers.providers as Record<string, unknown> | undefined
    if (typeof profile !== 'object' || profile === null) return view
    const entry = findEntry(profile, model)
    view.mapping = mappingView(entry)
    view.compat = compatView(profile, entry)
    view.budgets = budgetsView(profile)
    return view
  }

  /** Switch the current model selection (and optionally its effort). */
  async select(sessionId: SessionId, provider: string, model: string, reasoningEffort: string | null): Promise<void> {
    unwrap<{ selected: ModelSelection }>(
      'selectModel',
      await this.connection.api.sessions.selectModel({
        sessionId,
        provider,
        model,
        ...(reasoningEffort === null ? {} : { reasoningEffort }),
      }),
    )
  }

  /**
   * Save a model's mapping config into the llm-pi-ai settings document.
   * models-list entries rebuild the whole list (settings.update, arrays
   * replace wholesale); modelOverrides entries use minimal path ops
   * (settings.mutate). Returns the fresh namespace view.
   */
  async saveConfig(
    provider: string,
    model: string,
    payload: SavePayload,
    expectedRevision: number | null,
  ): Promise<void> {
    const ns = await this.llmPiAiNamespace()
    if (ns === null) throw new PanelError('未找到 llm-pi-ai 设置命名空间（llm-pi-ai 适配器未注册），无法写入')
    if (!ns.writable) throw new PanelError('settings 文档为只读，无法写入')
    const value = ns.view.value as unknown
    const providers = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
    const profile = providers.providers as Record<string, unknown> | undefined
    const patch = effortPatch(payload)
    const hit = profile !== undefined ? findEntry(profile, model) : undefined
    const inList = hit?.inList === true
    const revisionArg = expectedRevision === null ? {} : { expectedRevision }

    if (inList) {
      // Whole-list rebuild (arrays replace wholesale in the merge).
      const source = Array.isArray(profile?.models) ? (profile.models as unknown[]) : []
      let found = false
      const nextModels = source.map((raw) => {
        const entry = raw as Record<string, unknown>
        if (entry.id !== model) return entry
        found = true
        return applyEntryPatch(entry, patch, payload)
      })
      if (!found) nextModels.push(applyEntryPatch({ id: model }, patch, payload))
      unwrap<SettingsNamespaceView>(
        'settings.update',
        await this.connection.api.settings.update(
          { ns: SETTINGS_NS, patch: { providers: { [provider]: { models: nextModels } } }, ...revisionArg },
        ),
      )
    } else {
      const modelBase = ['providers', provider, 'modelOverrides', model]
      const ops: SettingsPathOpView[] = []
      if (patch === false) {
        ops.push({ op: 'set', path: [...modelBase, 'reasoningEfforts'], value: false })
      } else if (patch === null) {
        ops.push({ op: 'unset', path: [...modelBase, 'reasoningEfforts'] })
      } else {
        for (const level of LEVELS) {
          if (patch[level] === undefined) ops.push({ op: 'unset', path: [...modelBase, 'reasoningEfforts', level] })
          else ops.push({ op: 'set', path: [...modelBase, 'reasoningEfforts', level], value: patch[level] })
        }
      }
      ops.push(...compatOps(modelBase, payload))
      ops.push(...budgetOps(provider, payload))
      if (ops.length > 0) {
        unwrap<SettingsNamespaceView>(
          'settings.mutate',
          await this.connection.api.settings.mutate({ ns: SETTINGS_NS, ops, ...revisionArg }),
        )
      }
    }
  }
}

/** Locate a model entry (models list first, then modelOverrides). */
function findEntry(
  profile: Record<string, unknown>,
  model: string,
): { entry: Record<string, unknown> | null; inList: boolean } {
  const list = profile.models
  if (Array.isArray(list)) {
    for (const raw of list) {
      const entry = raw as Record<string, unknown>
      if (entry !== null && typeof entry === 'object' && entry.id === model) {
        return { entry, inList: true }
      }
    }
  }
  const overrides = profile.modelOverrides
  if (typeof overrides === 'object' && overrides !== null) {
    const hit = (overrides as Record<string, unknown>)[model]
    if (typeof hit === 'object' && hit !== null) return { entry: hit as Record<string, unknown>, inList: false }
  }
  return { entry: null, inList: false }
}

/** Extract the mapping view from a model entry. */
function mappingView(entry: Record<string, unknown> | null): MappingView | null {
  if (entry === null || entry.reasoningEfforts === undefined) return null
  if (entry.reasoningEfforts === false) return { disabled: true, rows: [] }
  const rows: Array<{ level: string; wire: string | null }> = []
  const efforts = entry.reasoningEfforts
  if (typeof efforts === 'object' && efforts !== null) {
    for (const level of LEVELS) {
      const wire = (efforts as Record<string, unknown>)[level]
      if (wire === undefined) continue
      rows.push({ level, wire: wire === null ? null : String(wire) })
    }
  }
  return { disabled: false, rows }
}

/** Extract the compat view (model-level wins over provider-level). */
function compatView(profile: Record<string, unknown>, entry: Record<string, unknown> | null): CompatView {
  const source =
    entry !== null && typeof entry.compat === 'object' && entry.compat !== null
      ? (entry.compat as Record<string, unknown>)
      : typeof profile.compat === 'object' && profile.compat !== null
        ? (profile.compat as Record<string, unknown>)
        : null
  const view: CompatView = { thinkingFormat: null, supportsReasoningEffort: null }
  if (source === null) return view
  if (typeof source.thinkingFormat === 'string') view.thinkingFormat = source.thinkingFormat
  if (typeof source.supportsReasoningEffort === 'boolean') view.supportsReasoningEffort = source.supportsReasoningEffort
  return view
}

/** Extract the provider-level thinkingBudgets table. */
function budgetsView(profile: Record<string, unknown>): BudgetRows[] | null {
  const budgets = profile.thinkingBudgets
  if (typeof budgets !== 'object' || budgets === null) return null
  const rows: BudgetRows[] = []
  for (const level of BUDGET_LEVELS) {
    const tokens = (budgets as Record<string, unknown>)[level]
    if (typeof tokens === 'number') rows.push({ level, tokens })
  }
  return rows.length === 0 ? null : rows
}

/** Build the reasoningEfforts patch (false | declared dict | null to clear). */
function effortPatch(payload: SavePayload): false | Record<string, string | null> | null {
  if (payload.disable === true) return false
  const dict: Record<string, string | null> = {}
  for (const level of LEVELS) {
    const wire = payload.efforts[level]
    if (wire === undefined) continue
    dict[level] = wire === null || wire === '' ? null : String(wire)
  }
  if (Object.keys(dict).length === 0) return null
  return dict
}

/** Patch a list entry (wholesale-replacement semantics). */
function applyEntryPatch(
  entry: Record<string, unknown>,
  patch: false | Record<string, string | null> | null,
  payload: SavePayload,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...entry }
  if (patch === false) next.reasoningEfforts = false
  else if (patch === null) delete next.reasoningEfforts
  else next.reasoningEfforts = patch
  const compat = payload.compat ?? {}
  const hasFormat = typeof compat.format === 'string' && compat.format !== ''
  const hasSupports = typeof compat.supports === 'boolean'
  if (hasFormat || hasSupports || compat.format === '' || compat.supports === 'unset') {
    const merged: Record<string, unknown> = {
      ...(typeof next.compat === 'object' && next.compat !== null ? (next.compat as Record<string, unknown>) : {}),
    }
    if (hasFormat) merged.thinkingFormat = compat.format
    if (compat.format === '') delete merged.thinkingFormat
    if (hasSupports) merged.supportsReasoningEffort = compat.supports
    if (compat.supports === 'unset') delete merged.supportsReasoningEffort
    if (Object.keys(merged).length === 0) delete next.compat
    else next.compat = merged
  }
  return next
}

/** Model-level compat path ops. */
function compatOps(modelBase: string[], payload: SavePayload): SettingsPathOpView[] {
  const ops: SettingsPathOpView[] = []
  const compat = payload.compat ?? {}
  if (typeof compat.format === 'string') {
    if (compat.format === '') ops.push({ op: 'unset', path: [...modelBase, 'compat', 'thinkingFormat'] })
    else ops.push({ op: 'set', path: [...modelBase, 'compat', 'thinkingFormat'], value: compat.format })
  }
  if (compat.supports === true || compat.supports === false) {
    ops.push({ op: 'set', path: [...modelBase, 'compat', 'supportsReasoningEffort'], value: compat.supports })
  }
  if (compat.supports === 'unset') {
    ops.push({ op: 'unset', path: [...modelBase, 'compat', 'supportsReasoningEffort'] })
  }
  return ops
}

/** Provider-level thinkingBudgets path ops. */
function budgetOps(provider: string, payload: SavePayload): SettingsPathOpView[] {
  const ops: SettingsPathOpView[] = []
  const budgets = payload.budgets
  if (typeof budgets !== 'object' || budgets === null) return ops
  for (const level of BUDGET_LEVELS) {
    const value = budgets[level]
    if (value === undefined || value === null) continue
    if (value === '') {
      ops.push({ op: 'unset', path: ['providers', provider, 'thinkingBudgets', level] })
      continue
    }
    const number = Number(value)
    if (!Number.isFinite(number) || number < 0) throw new PanelError(`思考预算必须是非负数字: ${level}`)
    ops.push({ op: 'set', path: ['providers', provider, 'thinkingBudgets', level], value: number })
  }
  return ops
}

/** Re-export for the panel (agent-default-model current selection read). */
export { DEFAULT_MODEL_NS }
