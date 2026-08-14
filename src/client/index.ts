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

import React from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the LocaleNamespaceMap merge table and the settings slot
// contract (SlotMap merges 'settings.section' etc.).
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { IntensityApi } from './api.ts'
import { IntensityManager } from './panel.tsx'

/** Locale namespace this plugin owns (also the settings namespace). */
const NS = 'thinking-intensity'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Thinking-intensity surface copy (keys are UI strings). */
    'thinking-intensity': Record<string, string>
  }
}

/** Required services (fiber inject waiting — the runtime must be up first). */
export const inject = ['slots', 'locale', 'connection']

/** Type-only surface (export discipline). */
export type { ConfigView, DirectoryView, IntensityApi, PanelError } from './api.ts'
export type { PanelProps } from './panel.tsx'

/**
 * Mount the thinking-intensity settings section.
 * @param ctx - client root context (slots + locale services).
 */
export function apply(ctx: ClientContext): void {
  const connection = ctx.get('connection') as ConnectionHandle | undefined
  if (connection === undefined) {
    console.warn('[dsh-thinking-intensity] connection service unavailable; panel disabled')
    return
  }
  const api = new IntensityApi(connection)

  ctx.effect(
    () =>
      ctx.locale.register(NS, {
        zh: {},
        en: {},
      }),
    'thinking-intensity: dictionaries',
  )

  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      {
        name: 'settings.section',
        id: 'thinking-intensity',
        order: 12,
        label: () => '思维强度',
      },
      (props) => {
        // Global slot standard props: useSessions snapshot hook (SessionListState).
        const sessionId = props.useSessions((s) => s.current)
        return React.createElement(IntensityManager, {
          api,
          sessionId: sessionId ?? null,
        })
      },
    ),
  )
}
