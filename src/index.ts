/**
 * dsh-thinking-intensity — host half.
 *
 * Everything the panel does is browser work (model directory over the session
 * wire API, settings-document edits through the settings API), so the host
 * half's only behavior is a system-prompt section announcing the plugin to
 * every agent, plus an installSettingsSection so the web settings surface can
 * flip the announcement and the master switch. The browser half (./client)
 * renders the model/mapping panel.
 */

import type { Context } from '@deepseek-ai/cordis'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import z from 'schemastery'
import type {} from '@deepseek-ai/dsh-system-prompt'

/** Order of the announcement section within the tool-guidance band. */
const SECTION_ORDER = 210

export const inject = ['systemPrompt']

/** Model-facing announcement: plugin presence, capabilities, and limits. */
export const THINKING_GUIDANCE =
  '本机已安装 dsh-thinking-intensity 插件（DSH Web GUI 的思维强度管理器）：设置页「思维强度」分区。能力：列出 harness 当前全部模型（按 provider 分组）；为每个模型编辑 reasoningEfforts 档位映射（键 = 界面档位 off/minimal/low/medium/high/xhigh/max，值 = 发送给网关的拼写，留空 = 省略不发送）、thinkingFormat / supportsReasoningEffort 兼容开关与 thinkingBudgets 思考预算，写入 llm-pi-ai 设置文档（settings.yaml），下一次请求即生效；一键切换当前模型的思维强度（agent-default-model.reasoningEffort）并可把任意模型设为当前。主流映射预设含 DeepSeek 官方档位（off/high/max，与 DeepSeek 网关 hiMax 档位表一致）。用户提到「思维强度 / 推理强度 / reasoning effort / 档位映射」时即指本插件，请据此协作。'

/**
 * Settings namespace of the announcement capability — the section the web
 * settings surface edits. Spelled here rather than imported: the browser
 * half spells the same value and must not depend on a Host package.
 */
export const THINKING_SETTINGS_NAMESPACE = settingsNamespace('dsh-thinking-intensity')

/** Plugin config, validated by the same-named schemastery schema. */
export interface Config {
  /**
   * When true (default), a system-prompt section announces the plugin to
   * every agent. Set false to keep it silent in prompts.
   */
  announceToAgent?: boolean
  /** Master switch for the plugin (browser half + host announcement). */
  enabled?: boolean
}

export const Config: z<Config> = z.object({
  announceToAgent: z.boolean().default(true),
  enabled: z.boolean().default(true),
})

/** Schema default, re-read for hand-built test contexts (the loader applies them normally). */
const DEFAULT_ANNOUNCE = true

/**
 * Register the announcement section, gated on the composition entry's
 * `announceToAgent` (and the live settings value once the web settings
 * surface is served). The section is re-registered whenever the source
 * changes, so a settings edit takes effect without a restart.
 * @param ctx - the plugin context (systemPrompt injected).
 * @param config - resolved plugin config (schema defaults applied by the loader).
 */
export function apply(ctx: Context, config?: Config): void {
  // The live source the announcement reads: the settings section once the web
  // settings surface is served, the composition entry otherwise
  // (installSettingsSection swaps it when the namespace registers).
  let current: () => Config = () => config ?? {}
  let disposeSection: (() => void) | undefined

  // Register (or drop) the announcement to match the current source. The
  // section is kept under one disposer: re-registering first tears the old
  // one down so a duplicate-name registration never throws.
  const sync = (): void => {
    if (disposeSection !== undefined) {
      disposeSection()
      disposeSection = undefined
    }
    if ((current().enabled ?? true) === false) return
    if ((current().announceToAgent ?? DEFAULT_ANNOUNCE) === false) return
    disposeSection = ctx.systemPrompt.section({
      name: 'plugin:dsh-thinking-intensity',
      order: SECTION_ORDER,
      text: THINKING_GUIDANCE,
    })
  }

  installSettingsSection(ctx, THINKING_SETTINGS_NAMESPACE, Config, config ?? {}, {
    setSource: (source) => {
      current = source
    },
    onChange: sync,
  })

  // Initial registration from the composition entry (covers deployments with
  // no settings service, whose installSettingsSection never fires its hooks).
  sync()
}
