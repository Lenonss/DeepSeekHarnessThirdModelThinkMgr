/**
 * Browser-side data access for the thinking-intensity panel — the only path
 * the UI reads/writes harness state through. Uses the session wire API
 * (model directory + selection) and the settings API (llm-pi-ai document),
 * the same seams the shipped settings Models page uses; no host RPC, no
 * harness, no custom routes.
 */
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client';
import type { SettingsNamespaceView } from '@deepseek-ai/dsh-client-connection/client';
import type { SessionId } from '@deepseek-ai/dsh-client-connection/client';
import type { ModelSelection } from '@deepseek-ai/dsh-client-connection/client';
import type { BudgetRows, CompatView, MappingView, SavePayload } from './draft.ts';
/** The agent-default-model settings namespace (current selection lives here). */
declare const DEFAULT_MODEL_NS = "agent-default-model";
/** Error carrying a user-readable failure text. */
export declare class PanelError extends Error {
    constructor(message: string);
}
/** One model entry inside a provider group. */
export interface ModelItem {
    provider: string;
    id: string;
    name: string;
    efforts: Array<{
        id: string;
        name: string;
    }>;
    hasReasoning: boolean;
    defaultEffort: string | null;
}
/** The full panel data view: provider groups + current selection. */
export interface DirectoryView {
    groups: Array<{
        provider: string;
        name: string;
        models: ModelItem[];
    }>;
    current: ModelSelection | null;
}
/** One model's full config view (directory + settings document). */
export interface ConfigView {
    provider: string;
    model: string;
    modelName: string;
    isCurrent: boolean;
    currentEffort: string | null;
    efforts: Array<{
        id: string;
        name: string;
    }>;
    hasReasoning: boolean;
    defaultEffort: string | null;
    error: string | null;
    mapping: MappingView | null;
    compat: CompatView;
    budgets: BudgetRows[] | null;
    canSave: boolean;
    revision: number | null;
}
/**
 * API facade over the session wire + settings wire APIs.
 * `connection` is the injected connection handle (task-board pattern).
 */
export declare class IntensityApi {
    private readonly connection;
    constructor(connection: ConnectionHandle);
    /** Resolve the session used for model-directory calls (caller-supplied fallback). */
    directory(sessionId: SessionId): Promise<DirectoryView>;
    /** Describe the settings document; returns the llm-pi-ai namespace view when registered. */
    llmPiAiNamespace(): Promise<{
        view: SettingsNamespaceView;
        writable: boolean;
    } | null>;
    /**
     * Build the full config view for one provider/model from the directory +
     * settings document.
     */
    config(sessionId: SessionId, provider: string, model: string): Promise<ConfigView>;
    /** Switch the current model selection (and optionally its effort). */
    select(sessionId: SessionId, provider: string, model: string, reasoningEffort: string | null): Promise<void>;
    /**
     * Save a model's mapping config into the llm-pi-ai settings document.
     * models-list entries rebuild the whole list (settings.update, arrays
     * replace wholesale); modelOverrides entries use minimal path ops
     * (settings.mutate). Returns the fresh namespace view.
     */
    saveConfig(provider: string, model: string, payload: SavePayload, expectedRevision: number | null): Promise<void>;
}
/** Re-export for the panel (agent-default-model current selection read). */
export { DEFAULT_MODEL_NS };
