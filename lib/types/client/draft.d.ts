/**
 * Mapping draft state and the pure functions that translate between the
 * wire view (config from settings/models APIs) and the editor draft, plus the
 * save payload the settings.mutate/update path consumes. Ported from the
 * dynamic-plugin version with identical semantics.
 */
import { type EffortsDict, type Preset } from './presets.ts';
/** One parsed mapping row from the settings document. */
export interface MappingRow {
    level: string;
    wire: string | null;
}
/** The mapping view extracted from a model entry. */
export interface MappingView {
    disabled: boolean;
    rows: MappingRow[];
}
/** Compat switches view (model-level wins, falls back to provider-level). */
export interface CompatView {
    thinkingFormat: string | null;
    supportsReasoningEffort: boolean | null;
}
/** Budget rows from the provider-level thinkingBudgets table. */
export interface BudgetRows {
    level: string;
    tokens: number;
}
/** Editor draft: which levels are included + their wire spellings. */
export interface Draft {
    included: Record<string, boolean>;
    wire: Record<string, string>;
    disable: boolean;
    format: string;
    supports: string;
    budgets: Record<string, string>;
}
/** Save payload consumed by the settings.mutate/update writer. */
export interface SavePayload {
    disable: boolean;
    efforts: EffortsDict;
    compat: {
        format: string;
        supports: boolean | 'unset';
    };
    /** Draft budget strings ('', a number text, or absent); writer parses them. */
    budgets: Record<string, string> | null;
}
/** Initialize a draft from a config view. */
export declare function initDraft(config: {
    mapping: MappingView | null;
    compat: CompatView;
    budgets: BudgetRows[] | null;
}): Draft;
/** Translate the draft into the save payload. */
export declare function payloadOf(draft: Draft): SavePayload;
/** Apply a mainstream preset to the draft. */
export declare function presetDraft(current: Draft, preset: Preset): Draft;
