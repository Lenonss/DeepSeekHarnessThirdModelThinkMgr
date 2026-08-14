/**
 * Thinking-intensity manager panel: left model directory (grouped by
 * provider), right mapping editor for the selected model. Ported from the
 * dynamic-plugin version; data access via IntensityApi (session wire +
 * settings wire APIs), no host RPC.
 */

import React, { useCallback, useEffect, useState } from 'react'
import type { SessionId } from '@deepseek-ai/dsh-client-connection/client'
import type { IntensityApi, ConfigView, DirectoryView } from './api.ts'
import { BUDGET_LEVELS, FORMATS, LEVELS, LEVEL_LABELS, PRESETS } from './presets.ts'
import { initDraft, payloadOf, presetDraft, type Draft } from './draft.ts'
import './panel.css'

/** Props for the panel host. */
export interface PanelProps {
  api: IntensityApi
  /** Current session id; null while none is active. */
  sessionId: SessionId | null
}

/** Combine a level id with its display name. */
function effortLabel(id: string, name: string): string {
  const cn = LEVEL_LABELS[id as keyof typeof LEVEL_LABELS]
  if (cn === undefined) return name
  return `${cn} · ${name}`
}

/** Refresh button row. */
function ReloadBar(props: { onReload: () => void }): React.ReactElement {
  return (
    <div className="ddjm-row">
      <button type="button" className="ddjm-btn" onClick={props.onReload}>刷新</button>
    </div>
  )
}

/** One level mapping row (enable checkbox + wire-spelling input). */
function LevelRow(props: {
  level: string
  draft: Draft
  busy: boolean
  onToggle: () => void
  onWire: (value: string) => void
}): React.ReactElement {
  const included = props.draft.included[props.level]
  return (
    <div className="ddjm-row">
      <input type="checkbox" checked={included} onChange={props.onToggle} disabled={props.busy} />
      <span className="ddjm-level">
        {LEVEL_LABELS[props.level as keyof typeof LEVEL_LABELS]} {props.level}
      </span>
      <input
        type="text"
        className="ddjm-input"
        value={props.draft.wire[props.level]}
        placeholder="留空 = 省略不发送"
        onChange={(e) => props.onWire(e.target.value)}
        disabled={props.busy || !included}
      />
    </div>
  )
}

/** Mainstream mapping preset dropdown. */
function PresetRow(props: { busy: boolean; onApply: (preset: (typeof PRESETS)[number]) => void }): React.ReactElement {
  const apply = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const hit = PRESETS.find((preset) => preset.id === event.target.value)
    if (hit === undefined) return
    props.onApply(hit)
    event.target.value = ''
  }
  return (
    <div className="ddjm-row">
      <span className="ddjm-field-label">主流映射预设</span>
      <select className="ddjm-select" onChange={apply} disabled={props.busy}>
        <option value="">选择主流映射预设…</option>
        {PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name}（{preset.note}）
          </option>
        ))}
      </select>
    </div>
  )
}

/** Compat switches row. */
function CompatRow(props: { draft: Draft; busy: boolean; onField: (key: 'format' | 'supports', value: string) => void }): React.ReactElement {
  return (
    <div className="ddjm-row">
      <span className="ddjm-field-label">thinkingFormat</span>
      <select
        className="ddjm-select"
        value={props.draft.format}
        onChange={(e) => props.onField('format', e.target.value)}
        disabled={props.busy}
      >
        <option value="">未设置</option>
        {FORMATS.map((format) => (
          <option key={format} value={format}>{format}</option>
        ))}
      </select>
      <span className="ddjm-field-label">supportsReasoningEffort</span>
      <select
        className="ddjm-select"
        value={props.draft.supports}
        onChange={(e) => props.onField('supports', e.target.value)}
        disabled={props.busy}
      >
        <option value="unset">未设置</option>
        <option value="true">是</option>
        <option value="false">否</option>
      </select>
    </div>
  )
}

/** Thinking-budget inputs row. */
function BudgetRow(props: { draft: Draft; busy: boolean; onBudget: (level: string, value: string) => void }): React.ReactElement {
  return (
    <div className="ddjm-row">
      <span className="ddjm-field-label">thinkingBudgets (tokens)</span>
      {BUDGET_LEVELS.map((level) => (
        <label key={level} className="ddjm-field">
          <span className="ddjm-field-label">{level}</span>
          <input
            type="number"
            min={0}
            className="ddjm-input ddjm-num"
            value={props.draft.budgets[level]}
            onChange={(e) => props.onBudget(level, e.target.value)}
            disabled={props.busy}
            placeholder="默认"
          />
        </label>
      ))}
    </div>
  )
}

/** Quick effort switch for the current model. */
function EffortStrip(props: {
  cfg: ConfigView
  busy: boolean
  onPick: (effort: string | null) => void
}): React.ReactElement {
  const buttons: React.ReactElement[] = [
    <button
      type="button"
      key="default"
      className={`ddjm-btn${props.cfg.currentEffort === null ? ' ddjm-active' : ''}`}
      onClick={() => props.onPick(null)}
      disabled={props.busy}
    >
      默认
    </button>,
  ]
  for (const item of props.cfg.efforts) {
    const isCurrent = props.cfg.currentEffort === item.id
    const isDefault = props.cfg.defaultEffort !== null && props.cfg.defaultEffort === item.id
    buttons.push(
      <button
        type="button"
        key={item.id}
        className={`ddjm-btn${isCurrent ? ' ddjm-active' : ''}`}
        onClick={() => props.onPick(item.id)}
        disabled={props.busy}
      >
        {effortLabel(item.id, item.name)}
        {isDefault ? <span className="ddjm-badge"> 默认</span> : null}
      </button>,
    )
  }
  return <div className="ddjm-row">{buttons}</div>
}

/** Left model directory pane. */
function ModelPane(props: {
  dir: DirectoryView
  sel: { provider: string; model: string } | null
  onSelect: (provider: string, model: string) => void
}): React.ReactElement {
  const rows: React.ReactElement[] = []
  for (const group of props.dir.groups) {
    rows.push(
      <div key={group.provider} className="ddjm-group">{group.name}</div>,
    )
    for (const model of group.models) {
      const isCurrent =
        props.dir.current !== null &&
        props.dir.current.provider === group.provider &&
        props.dir.current.model === model.id
      const isSelected =
        props.sel !== null && props.sel.provider === group.provider && props.sel.model === model.id
      rows.push(
        <button
          type="button"
          key={`${group.provider}:${model.id}`}
          className={`ddjm-model${isSelected ? ' ddjm-model-active' : ''}`}
          onClick={() => props.onSelect(group.provider, model.id)}
        >
          {model.name}
          {isCurrent ? <span className="ddjm-badge">当前</span> : null}
        </button>,
      )
    }
  }
  return <div className="ddjm-side">{rows}</div>
}

/** Editor body: everything the right pane renders. */
function EditorBody(props: {
  cfg: ConfigView
  draft: Draft
  busy: boolean
  note: string | null
  onSave: () => void
  onPick: (effort: string | null) => void
  onPreset: (preset: (typeof PRESETS)[number]) => void
  onToggle: (level: string) => void
  onWire: (level: string, value: string) => void
  onDisable: () => void
  onField: (key: 'format' | 'supports', value: string) => void
  onBudget: (level: string, value: string) => void
}): React.ReactElement {
  const cfg = props.cfg
  const note =
    props.note === null ? null : (
      <div className={props.note.includes('失败') ? 'ddjm-error' : 'ddjm-meta'}>{props.note}</div>
    )
  return (
    <div className="ddjm-panel">
      <div className="ddjm-title">
        {cfg.modelName}
        <span className="ddjm-badge">
          · {cfg.provider}
          {cfg.isCurrent ? ' · 当前使用' : ''}
        </span>
      </div>
      {cfg.error !== null ? <div className="ddjm-error">{cfg.error}</div> : null}
      {cfg.hasReasoning === false ? (
        <div className="ddjm-meta">该模型未声明思维强度档位。</div>
      ) : null}
      {cfg.isCurrent ? (
        <EffortStrip cfg={cfg} busy={props.busy} onPick={props.onPick} />
      ) : (
        <div className="ddjm-row">
          <button type="button" className="ddjm-btn" onClick={() => props.onPick(null)} disabled={props.busy}>
            设为当前模型
          </button>
        </div>
      )}
      <PresetRow busy={props.busy} onApply={props.onPreset} />
      <div className="ddjm-section">
        <div className="ddjm-meta">档位映射（键 = 界面档位，值 = 发送给网关的拼写）</div>
        {LEVELS.map((level) => (
          <LevelRow
            key={level}
            level={level}
            draft={props.draft}
            busy={props.busy}
            onToggle={() => props.onToggle(level)}
            onWire={(value) => props.onWire(level, value)}
          />
        ))}
      </div>
      <div className="ddjm-row">
        <input type="checkbox" checked={props.draft.disable} onChange={props.onDisable} disabled={props.busy} />
        <span>禁用该模型推理 (reasoningEfforts: false)</span>
      </div>
      <CompatRow draft={props.draft} busy={props.busy} onField={props.onField} />
      <BudgetRow draft={props.draft} busy={props.busy} onBudget={props.onBudget} />
      <div className="ddjm-row">
        <button
          type="button"
          className="ddjm-btn ddjm-save"
          onClick={props.onSave}
          disabled={props.busy || cfg.canSave !== true}
        >
          {props.busy ? '保存中…' : '保存映射配置'}
        </button>
        {cfg.canSave !== true ? <span className="ddjm-meta">设置文档不可写</span> : null}
        {note}
      </div>
    </div>
  )
}

/** Config editor: draft state + save/switch logic. */
function ConfigEditor(props: {
  cfg: ConfigView
  sessionId: SessionId | null
  api: IntensityApi
  onSaved: (cfg: ConfigView) => void
}): React.ReactElement {
  const [draft, setDraft] = useState<Draft>(() => initDraft(props.cfg))
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const save = useCallback(async () => {
    setBusy(true)
    setNote(null)
    try {
      if (props.sessionId === null) throw new Error('当前没有活动会话')
      await props.api.saveConfig(props.cfg.provider, props.cfg.model, payloadOf(draft), props.cfg.revision)
      const fresh = await props.api.config(props.sessionId, props.cfg.provider, props.cfg.model)
      setDraft(initDraft(fresh))
      props.onSaved(fresh)
      setNote('已保存到 settings 文档')
    } catch (err) {
      setNote(`保存失败: ${err instanceof Error ? err.message : String(err)}`)
    }
    setBusy(false)
  }, [props, draft])

  const pick = useCallback(
    async (effort: string | null) => {
      setBusy(true)
      setNote(null)
      try {
        if (props.sessionId === null) throw new Error('当前没有活动会话')
        await props.api.select(props.sessionId, props.cfg.provider, props.cfg.model, effort)
        const fresh = await props.api.config(props.sessionId, props.cfg.provider, props.cfg.model)
        props.onSaved(fresh)
        setNote(effort === null ? '已切换当前模型（提供方默认强度）' : `当前强度已切换: ${effort}`)
      } catch (err) {
        setNote(`切换失败: ${err instanceof Error ? err.message : String(err)}`)
      }
      setBusy(false)
    },
    [props],
  )

  return (
    <EditorBody
      cfg={props.cfg}
      draft={draft}
      busy={busy}
      note={note}
      onSave={save}
      onPick={pick}
      onPreset={(preset) => setDraft(presetDraft(draft, preset))}
      onToggle={(level) => setDraft({ ...draft, included: { ...draft.included, [level]: !draft.included[level] } })}
      onWire={(level, value) => setDraft({ ...draft, wire: { ...draft.wire, [level]: value } })}
      onDisable={() => setDraft({ ...draft, disable: !draft.disable })}
      onField={(key, value) => setDraft({ ...draft, [key]: value })}
      onBudget={(level, value) => setDraft({ ...draft, budgets: { ...draft.budgets, [level]: value } })}
    />
  )
}

/**
 * The panel: two-column layout (left directory, right editor). Loads the
 * directory on mount and on refresh; selects the current model initially.
 */
export function IntensityManager(props: PanelProps): React.ReactElement {
  const [dir, setDir] = useState<DirectoryView | null>(null)
  const [dirError, setDirError] = useState<string | null>(null)
  const [sel, setSel] = useState<{ provider: string; model: string } | null>(null)
  const [cfg, setCfg] = useState<ConfigView | null>(null)
  const [cfgError, setCfgError] = useState<string | null>(null)

  const sessionId = props.sessionId

  const loadDir = useCallback(async (): Promise<DirectoryView | null> => {
    if (sessionId === null) {
      setDirError('当前没有活动会话')
      return null
    }
    try {
      const data = await props.api.directory(sessionId)
      setDir(data)
      setDirError(null)
      return data
    } catch (err) {
      setDirError(err instanceof Error ? err.message : String(err))
      return null
    }
  }, [props.api, sessionId])

  const loadCfg = useCallback(
    async (provider: string, model: string) => {
      if (sessionId === null) {
        setCfgError('当前没有活动会话')
        return
      }
      try {
        const data = await props.api.config(sessionId, provider, model)
        setCfg(data)
        setCfgError(null)
      } catch (err) {
        setCfgError(err instanceof Error ? err.message : String(err))
      }
    },
    [props.api, sessionId],
  )

  const reload = useCallback(async () => {
    const data = await loadDir()
    if (data === null || data.current === null) return
    const target = sel ?? { provider: data.current.provider, model: data.current.model }
    setSel(target)
    await loadCfg(target.provider, target.model)
  }, [loadDir, loadCfg, sel])

  // Initial load only: re-running on every `sel` change would race the click
  // handler (click → setSel → reload → loadCfg overwrites the clicked model).
  const boot = useCallback(async () => {
    const data = await loadDir()
    if (data === null || data.current === null) return
    const target = { provider: data.current.provider, model: data.current.model }
    setSel(target)
    await loadCfg(target.provider, target.model)
  }, [loadDir, loadCfg])

  useEffect(() => {
    void boot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const select = useCallback((provider: string, model: string): void => {
    setSel({ provider, model })
    void loadCfg(provider, model)
  }, [loadCfg])

  const saved = useCallback((fresh: ConfigView): void => {
    setCfg(fresh)
    void loadDir()
  }, [loadDir])

  const left =
    dir === null ? (
      <div className={dirError !== null ? 'ddjm-error' : 'ddjm-meta'}>
        {dirError !== null ? dirError : '加载模型清单…'}
      </div>
    ) : (
      <ModelPane dir={dir} sel={sel} onSelect={select} />
    )

  const right =
    cfg === null ? (
      <div className={cfgError !== null ? 'ddjm-error' : 'ddjm-meta'}>
        {cfgError !== null ? cfgError : '加载配置…'}
      </div>
    ) : (
      <ConfigEditor
        key={`${cfg.provider}:${cfg.model}`}
        cfg={cfg}
        sessionId={props.sessionId}
        api={props.api}
        onSaved={saved}
      />
    )

  return (
    <div className="ddjm-panel">
      <ReloadBar onReload={() => void reload()} />
      <div className="ddjm-shell">
        <div className="ddjm-side-wrap">{left}</div>
        <div className="ddjm-main">{right}</div>
      </div>
    </div>
  )
}
