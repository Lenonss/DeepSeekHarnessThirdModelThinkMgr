/**
 * Browser-half entry for the dsh-thinking-intensity plugin — runs inside the
 * dsh web GUI.
 *
 * Registers the settings.section entry (the full two-pane manager panel) and
 * the locale dictionaries. Data access runs through the session wire API
 * (model directory + selection) and the settings API (llm-pi-ai document) —
 * no host RPC, no harness.
 *
 * Export discipline (packages/client rule): the /client surface carries what
 * cordis loading needs plus types only — all value exports stay internal.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Thinking-intensity surface copy (keys are UI strings). */
        'thinking-intensity': Record<string, string>;
    }
}
/** Required services (fiber inject waiting — the runtime must be up first). */
export declare const inject: string[];
/** Type-only surface (export discipline). */
export type { ConfigView, DirectoryView, IntensityApi, PanelError } from './api.ts';
export type { PanelProps } from './panel.tsx';
/**
 * Mount the thinking-intensity settings section.
 * @param ctx - client root context (slots + locale services).
 */
export declare function apply(ctx: ClientContext): void;
