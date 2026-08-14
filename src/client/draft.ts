/**
 * Mapping draft state and the pure functions that translate between the
 * wire view (config from settings/models APIs) and the editor draft, plus the
 * save payload the settings.mutate/update path consumes. Ported from the
 * dynamic-plugin version with identical semantics.
 */

import { BUDGET_LEVELS, LEVELS, type EffortsDict, type Preset } from './presets.ts'

/** One parsed mapping row from the settings document. */
export interface MappingRow {
  level: string
  wire: string | null
}

/** The mapping view extracted from a model entry. */
export interface MappingView {
  disabled: boolean
  rows: MappingRow[]
}

/** Compat switches view (model-level wins, falls back to provider-level). */
export interface CompatView {
  thinkingFormat: string | null
  supportsReasoningEffort: boolean | null
}

/** Budget rows from the provider-level thinkingBudgets table. */
export interface BudgetRows {
  level: string
  tokens: number
}

/** Editor draft: which levels are included + their wire spellings. */
export interface Draft {
  included: Record<string, boolean>
  wire: Record<string, string>
  disable: boolean
  format: string
  supports: string // 'unset' | 'true' | 'false'
  budgets: Record<string, string>
}

/** Save payload consumed by the settings.mutate/update writer. */
export interface SavePayload {
  disable: boolean
  efforts: EffortsDict
  compat: { format: string; supports: boolean | 'unset' }
  /** Draft budget strings ('', a number text, or absent); writer parses them. */
  budgets: Record<string, string> | null
}

/** Initialize a draft from a config view. */
export function initDraft(config: {
  mapping: MappingView | null
  compat: CompatView
  budgets: BudgetRows[] | null
}): Draft {
  const draft: Draft = {
    included: {},
    wire: {},
    disable: false,
    format: '',
    supports: 'unset',
    budgets: {},
  }
  for (const level of LEVELS) {
    draft.included[level] = false
    draft.wire[level] = ''
  }
  for (const level of BUDGET_LEVELS) draft.budgets[level] = ''
  if (config.mapping !== null) {
    draft.disable = config.mapping.disabled === true
    for (const row of config.mapping.rows) {
      draft.included[row.level] = true
      draft.wire[row.level] = row.wire === null ? '' : row.wire
    }
  }
  if (config.compat !== null) {
    if (config.compat.thinkingFormat !== null) draft.format = config.compat.thinkingFormat
    if (config.compat.supportsReasoningEffort !== null) {
      draft.supports = config.compat.supportsReasoningEffort ? 'true' : 'false'
    }
  }
  if (config.budgets !== null) {
    for (const row of config.budgets) draft.budgets[row.level] = String(row.tokens)
  }
  return draft
}

/** Translate the draft into the save payload. */
export function payloadOf(draft: Draft): SavePayload {
  const efforts: EffortsDict = {}
  for (const level of LEVELS) {
    if (draft.included[level] !== true) continue
    const wire = draft.wire[level].trim()
    efforts[level] = wire === '' ? null : wire
  }
  const budgets: Record<string, string> = {}
  let budgetsTouched = false
  for (const level of BUDGET_LEVELS) {
    const text = draft.budgets[level].trim()
    if (text === '') continue
    budgetsTouched = true
    budgets[level] = text
  }
  return {
    disable: draft.disable,
    efforts,
    compat: {
      format: draft.format,
      supports: draft.supports === 'unset' ? 'unset' : draft.supports === 'true',
    },
    budgets: budgetsTouched ? budgets : null,
  }
}

/** Apply a mainstream preset to the draft. */
export function presetDraft(current: Draft, preset: Preset): Draft {
  const next: Draft = {
    ...current,
    included: { ...current.included },
    wire: { ...current.wire },
    budgets: { ...current.budgets },
  }
  for (const level of LEVELS) {
    const wire = preset.efforts[level]
    const has = wire !== undefined
    next.included[level] = has
    next.wire[level] = has ? (wire === null ? '' : wire) : ''
  }
  next.disable = preset.disable === true
  if (preset.format !== undefined) next.format = preset.format === null ? '' : preset.format
  if (preset.supports !== undefined) {
    next.supports = preset.supports === null ? 'unset' : preset.supports === true ? 'true' : 'false'
  }
  if (preset.budgets !== null && preset.budgets !== undefined) {
    for (const level of BUDGET_LEVELS) {
      next.budgets[level] = preset.budgets[level] === undefined ? '' : String(preset.budgets[level])
    }
  }
  return next
}
