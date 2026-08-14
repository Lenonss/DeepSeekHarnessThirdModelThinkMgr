# dsh-thinking-intensity

DSH Web GUI 的思维强度管理器插件。列出 harness 当前全部模型（按 provider
分组），为每个模型编辑 `reasoningEfforts` 档位映射（自定义线上拼写）、
`thinkingFormat` / `supportsReasoningEffort` 兼容开关与 `thinkingBudgets`
思考预算，写入 `llm-pi-ai` 设置文档（`settings.yaml`）；并一键切换当前模型
的思维强度（`agent-default-model.reasoningEffort`），可把任意模型设为当前。

热插拔：通过 `dsh plugin` 装进 `web` profile，不修改 dsh 源码。

## 安装

```bash
# 在运行 dsh 的终端（dsh 在 PATH 中）
dsh plugin --profile web add link:/path/to/packages/dsh-thinking-intensity

# dsh 不在 PATH 时的备选
npx @deepseek-ai/dsh plugin --profile web add link:/path/to/packages/dsh-thinking-intensity
```

`dsh plugin` 会在 `~/.dsh/profiles/web` 里执行 pnpm 安装，然后自动把声明了
`dsh.bundle.patch` 的包追加进 `dsh.profile.bundles` 层列表（reconcile）。
**装完需要重启 dsh（profile web）**，bundle 层变化才生效。

## 卸载

```bash
dsh plugin --profile web remove @linxin666/dsh-thinking-intensity
```

重启 dsh 后生效。插件自己的设置项（`dsh-thinking-intensity` 命名空间）留在
`settings.yaml`，重装会重新读回。

## 界面入口

- 设置页 → 「思维强度」分区：左侧模型清单（按 provider 分组，当前模型带
  「当前」徽标），右侧配置面板（强度快速切换 / 主流映射预设 / 档位映射编辑 /
  thinkingFormat / supportsReasoningEffort / thinkingBudgets / 保存）。

## 行为说明

- **模型清单与当前选择**：走 `sessions.models` / `sessions.selectModel`
  wire API（与 shipped 模型选择器同一数据源），含每个模型的
  `reasoning.efforts` / `defaultEffort`。
- **档位映射**：7 个档位（off/minimal/low/medium/high/xhigh/max），勾选启用，
  输入框为发送给网关的拼写；留空 = 省略不发送（`off` 允许）。
- **主流映射预设**：OpenAI/GPT、DeepSeek 官方（off/high/max，与 DeepSeek
  网关 `hiMax` 档位表一致）、DeepSeek 扩展（含 xhigh 钳制）、GLM/z.ai、
  Qwen、全档位直通、清空声明。
- **保存**：写入 `llm-pi-ai` 设置文档（`settings.yaml`）。
  - 模型属于 profile 的 `models` 列表时，整体重建该列表写回
    （`settings.update`，数组整体替换语义）；
  - 否则走 `modelOverrides` 最小路径操作（`settings.mutate`）。
  - 带 `expectedRevision` 防并发覆盖；写回经 pi-ai schema 校验，非法配置
    会被拒绝并在界面提示。
- **强度切换**：`sessions.selectModel({provider, model, reasoningEffort})`
  持久化默认模型选择，下一条消息起生效；`默认` 恢复提供方默认值。
- Host 半只提供系统提示词公告（可经设置关闭），不注册工具、不代理模型数据。

## 架构

- Host 半（`src/index.ts`，`exports "."`）：`systemPrompt.section` 公告 +
  `installSettingsSection`（`announceToAgent` / `enabled`），仿
  `@linxin666/dsh-client-ui-task-board`。
- Client 半（`src/client/`，`exports "./client"`）：纯浏览器实现。
  - `api.ts`：`IntensityApi` 封装（`sessions.models/selectModel` +
    `settings.describe/mutate/update`），无 harness、无自定义 HTTP 路由。
  - `panel.tsx`：两栏面板（`settings.section` 插槽，root scope，标准 props
    `useSessions` 取当前会话 ID）。
  - `presets.ts` / `draft.ts`：预设与草稿纯函数（从动态插件版本迁移）。
- 构建：`tsc`（d.ts）+ `tsdown`（`lib/index.js` ESM + `lib/client.js`
  web module-loader 格式，react 外部解析）。

## 依赖与前提

- 目标设备：dsh（`@deepseek-ai/dsh` ≥ 0.1.0-rc.6）+ `web` profile（含
  `dsh-web-app` / `dsh-web-ui-all` 或至少 `dsh-client-runtime` +
  `dsh-client-connection`）。
- harness 挂载 `llm-pi-ai` 适配器（settings 命名空间 `llm-pi-ai` 已注册），
  否则面板只能浏览模型与切换强度、不能保存映射配置。
- 无 `llm-pi-ai` 设置文档或 settings 只读时，保存按钮显示「设置文档不可写」。

## 故障排查

- **面板没出现**：确认 `dsh.profile.bundles` 含 `@linxin666/dsh-thinking-intensity`
  （`~/.dsh/profiles/web/package.json`）；确认 dsh 已重启；看浏览器控制台
  `[dsh-thinking-intensity]` 日志。
- **保存失败 "settings-rejected"**：pi-ai schema 校验拒绝，错误信息会指明
  具体档位/字段（如只声明 `off` 一个档位、或空声明）。
- **面板显示「当前没有活动会话」**：打开一个会话后再打开设置页。

## 备注

- 本包为本地分发形态（`link:` 安装），不发布 npm。
- 与动态 Cordis 插件（`think-*`）版本功能等价；两者同时存在时会重复注册
  「思维强度」设置分区，安装本包并验证通过后请移除动态版本。
