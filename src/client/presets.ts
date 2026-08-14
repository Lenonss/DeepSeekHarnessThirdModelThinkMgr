/**
 * Mainstream reasoning-effort mapping presets.
 *
 * Each preset fills the mapping draft (efforts dict + compat + budgets) so the
 * user can start from a known-good wire scheme and then edit per-level
 * spellings. The DeepSeek presets mirror the official pi-ai catalog
 * (`deepseek.json`: high → "high", max → "max", minimal/low/medium pinned
 * null) and the 9router gateway's `hiMax` level table (none/high/max).
 */

/** All selectable levels, escalation order (pi-ai THINKING_LEVELS). */
export const LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'] as const

export type LevelId = (typeof LEVELS)[number]

export const LEVEL_LABELS: Record<LevelId, string> = {
  off: '关闭',
  minimal: '极简',
  low: '低',
  medium: '中',
  high: '高',
  xhigh: '超高',
  max: '最大',
}

/** thinkingFormat wire formats a profile may name (pi-ai SUPPORTED_THINKING_FORMATS). */
export const FORMATS = [
  'openai',
  'deepseek',
  'openrouter',
  'together',
  'zai',
  'qwen',
  'string-thinking',
  'ant-ling',
] as const

/** Token-budget levels (pi-ai ThinkingBudgets schema: only these four). */
export const BUDGET_LEVELS = ['minimal', 'low', 'medium', 'high'] as const

export type BudgetLevel = (typeof BUDGET_LEVELS)[number]

/** A level → wire-spelling entry (null wire = "supported, send nothing", off only). */
export type EffortsDict = Partial<Record<LevelId, string | null>>

/** Thinking-budget table (provider-level, token-budget protocols only). */
export type BudgetsDict = Partial<Record<BudgetLevel, number>>

export interface Preset {
  id: string
  name: string
  format: string | null
  supports: boolean | 'unset'
  /** Whether the preset disables reasoning entirely (reasoningEfforts: false). */
  disable?: boolean
  note: string
  efforts: EffortsDict
  budgets: BudgetsDict | null
}

export const PRESETS: Preset[] = [
  {
    id: 'openai',
    name: 'OpenAI / GPT',
    format: 'openai',
    supports: true,
    note: 'off/low/medium/high',
    efforts: { off: null, low: 'low', medium: 'medium', high: 'high' },
    budgets: null,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek 官方',
    format: 'deepseek',
    supports: true,
    note: 'off/high/max',
    efforts: { off: null, high: 'high', max: 'max' },
    budgets: { minimal: 1024, low: 2048, medium: 8192, high: 16384 },
  },
  {
    id: 'deepseek-ext',
    name: 'DeepSeek 扩展',
    format: 'deepseek',
    supports: true,
    note: '含 xhigh 钳制',
    efforts: { off: null, low: 'low', medium: 'medium', high: 'high', xhigh: 'high', max: 'max' },
    budgets: { minimal: 1024, low: 2048, medium: 8192, high: 16384 },
  },
  {
    id: 'zai',
    name: 'GLM / z.ai',
    format: 'zai',
    supports: true,
    note: 'minimal~high',
    efforts: { off: null, minimal: 'minimal', low: 'low', medium: 'medium', high: 'high' },
    budgets: null,
  },
  {
    id: 'qwen',
    name: 'Qwen / 通义',
    format: 'qwen',
    supports: true,
    note: 'off~high',
    efforts: { off: null, low: 'low', medium: 'medium', high: 'high' },
    budgets: null,
  },
  {
    id: 'full',
    name: '全档位直通',
    format: 'openai',
    supports: true,
    note: 'off~max',
    efforts: { off: null, low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh', max: 'max' },
    budgets: null,
  },
  {
    id: 'empty',
    name: '清空声明',
    format: null,
    supports: 'unset',
    note: '沿用 catalog 默认',
    efforts: {},
    budgets: null,
  },
]
