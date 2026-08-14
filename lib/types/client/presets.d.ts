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
export declare const LEVELS: readonly ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
export type LevelId = (typeof LEVELS)[number];
export declare const LEVEL_LABELS: Record<LevelId, string>;
/** thinkingFormat wire formats a profile may name (pi-ai SUPPORTED_THINKING_FORMATS). */
export declare const FORMATS: readonly ["openai", "deepseek", "openrouter", "together", "zai", "qwen", "string-thinking", "ant-ling"];
/** Token-budget levels (pi-ai ThinkingBudgets schema: only these four). */
export declare const BUDGET_LEVELS: readonly ["minimal", "low", "medium", "high"];
export type BudgetLevel = (typeof BUDGET_LEVELS)[number];
/** A level → wire-spelling entry (null wire = "supported, send nothing", off only). */
export type EffortsDict = Partial<Record<LevelId, string | null>>;
/** Thinking-budget table (provider-level, token-budget protocols only). */
export type BudgetsDict = Partial<Record<BudgetLevel, number>>;
export interface Preset {
    id: string;
    name: string;
    format: string | null;
    supports: boolean | 'unset';
    /** Whether the preset disables reasoning entirely (reasoningEfforts: false). */
    disable?: boolean;
    note: string;
    efforts: EffortsDict;
    budgets: BudgetsDict | null;
}
export declare const PRESETS: Preset[];
