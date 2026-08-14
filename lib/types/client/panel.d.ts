/**
 * Thinking-intensity manager panel: left model directory (grouped by
 * provider), right mapping editor for the selected model. Ported from the
 * dynamic-plugin version; data access via IntensityApi (session wire +
 * settings wire APIs), no host RPC.
 */
import React from 'react';
import type { SessionId } from '@deepseek-ai/dsh-client-connection/client';
import type { IntensityApi } from './api.ts';
import './panel.css';
/** Props for the panel host. */
export interface PanelProps {
    api: IntensityApi;
    /** Resolve the current session id (null while none is active). */
    sessionId: () => SessionId | null;
    /** Re-resolve after a selection change (host may need to refresh). */
    onSessionChanged?: () => void;
}
/**
 * The panel: two-column layout (left directory, right editor). Loads the
 * directory on mount and on refresh; selects the current model initially.
 */
export declare function IntensityManager(props: PanelProps): React.ReactElement;
