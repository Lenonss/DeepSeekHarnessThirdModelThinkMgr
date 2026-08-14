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
import type { Context } from '@deepseek-ai/cordis';
import z from 'schemastery';
export declare const inject: string[];
/** Model-facing announcement: plugin presence, capabilities, and limits. */
export declare const THINKING_GUIDANCE = "\u672C\u673A\u5DF2\u5B89\u88C5 dsh-thinking-intensity \u63D2\u4EF6\uFF08DSH Web GUI \u7684\u601D\u7EF4\u5F3A\u5EA6\u7BA1\u7406\u5668\uFF09\uFF1A\u8BBE\u7F6E\u9875\u300C\u601D\u7EF4\u5F3A\u5EA6\u300D\u5206\u533A\u3002\u80FD\u529B\uFF1A\u5217\u51FA harness \u5F53\u524D\u5168\u90E8\u6A21\u578B\uFF08\u6309 provider \u5206\u7EC4\uFF09\uFF1B\u4E3A\u6BCF\u4E2A\u6A21\u578B\u7F16\u8F91 reasoningEfforts \u6863\u4F4D\u6620\u5C04\uFF08\u952E = \u754C\u9762\u6863\u4F4D off/minimal/low/medium/high/xhigh/max\uFF0C\u503C = \u53D1\u9001\u7ED9\u7F51\u5173\u7684\u62FC\u5199\uFF0C\u7559\u7A7A = \u7701\u7565\u4E0D\u53D1\u9001\uFF09\u3001thinkingFormat / supportsReasoningEffort \u517C\u5BB9\u5F00\u5173\u4E0E thinkingBudgets \u601D\u8003\u9884\u7B97\uFF0C\u5199\u5165 llm-pi-ai \u8BBE\u7F6E\u6587\u6863\uFF08settings.yaml\uFF09\uFF0C\u4E0B\u4E00\u6B21\u8BF7\u6C42\u5373\u751F\u6548\uFF1B\u4E00\u952E\u5207\u6362\u5F53\u524D\u6A21\u578B\u7684\u601D\u7EF4\u5F3A\u5EA6\uFF08agent-default-model.reasoningEffort\uFF09\u5E76\u53EF\u628A\u4EFB\u610F\u6A21\u578B\u8BBE\u4E3A\u5F53\u524D\u3002\u4E3B\u6D41\u6620\u5C04\u9884\u8BBE\u542B DeepSeek \u5B98\u65B9\u6863\u4F4D\uFF08off/high/max\uFF0C\u4E0E DeepSeek \u7F51\u5173 hiMax \u6863\u4F4D\u8868\u4E00\u81F4\uFF09\u3002\u7528\u6237\u63D0\u5230\u300C\u601D\u7EF4\u5F3A\u5EA6 / \u63A8\u7406\u5F3A\u5EA6 / reasoning effort / \u6863\u4F4D\u6620\u5C04\u300D\u65F6\u5373\u6307\u672C\u63D2\u4EF6\uFF0C\u8BF7\u636E\u6B64\u534F\u4F5C\u3002";
/**
 * Settings namespace of the announcement capability — the section the web
 * settings surface edits. Spelled here rather than imported: the browser
 * half spells the same value and must not depend on a Host package.
 */
export declare const THINKING_SETTINGS_NAMESPACE: import("@deepseek-ai/dsh-settings").SettingsNamespace;
/** Plugin config, validated by the same-named schemastery schema. */
export interface Config {
    /**
     * When true (default), a system-prompt section announces the plugin to
     * every agent. Set false to keep it silent in prompts.
     */
    announceToAgent?: boolean;
    /** Master switch for the plugin (browser half + host announcement). */
    enabled?: boolean;
}
export declare const Config: z<Config>;
/**
 * Register the announcement section, gated on the composition entry's
 * `announceToAgent` (and the live settings value once the web settings
 * surface is served). The section is re-registered whenever the source
 * changes, so a settings edit takes effect without a restart.
 * @param ctx - the plugin context (systemPrompt injected).
 * @param config - resolved plugin config (schema defaults applied by the loader).
 */
export declare function apply(ctx: Context, config?: Config): void;
