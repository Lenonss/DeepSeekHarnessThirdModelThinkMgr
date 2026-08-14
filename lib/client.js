window.__ModuleLoader__.load({
	id: "dsh-thinking-intensity",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		react = __toESM(react, 1);
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/presets.ts
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
		const LEVELS = [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh",
			"max"
		];
		const LEVEL_LABELS = {
			off: "关闭",
			minimal: "极简",
			low: "低",
			medium: "中",
			high: "高",
			xhigh: "超高",
			max: "最大"
		};
		/** thinkingFormat wire formats a profile may name (pi-ai SUPPORTED_THINKING_FORMATS). */
		const FORMATS = [
			"openai",
			"deepseek",
			"openrouter",
			"together",
			"zai",
			"qwen",
			"string-thinking",
			"ant-ling"
		];
		/** Token-budget levels (pi-ai ThinkingBudgets schema: only these four). */
		const BUDGET_LEVELS = [
			"minimal",
			"low",
			"medium",
			"high"
		];
		const PRESETS = [
			{
				id: "openai",
				name: "OpenAI / GPT",
				format: "openai",
				supports: true,
				note: "off/low/medium/high",
				efforts: {
					off: null,
					low: "low",
					medium: "medium",
					high: "high"
				},
				budgets: null
			},
			{
				id: "deepseek",
				name: "DeepSeek 官方",
				format: "deepseek",
				supports: true,
				note: "off/high/max",
				efforts: {
					off: null,
					high: "high",
					max: "max"
				},
				budgets: {
					minimal: 1024,
					low: 2048,
					medium: 8192,
					high: 16384
				}
			},
			{
				id: "deepseek-ext",
				name: "DeepSeek 扩展",
				format: "deepseek",
				supports: true,
				note: "含 xhigh 钳制",
				efforts: {
					off: null,
					low: "low",
					medium: "medium",
					high: "high",
					xhigh: "high",
					max: "max"
				},
				budgets: {
					minimal: 1024,
					low: 2048,
					medium: 8192,
					high: 16384
				}
			},
			{
				id: "zai",
				name: "GLM / z.ai",
				format: "zai",
				supports: true,
				note: "minimal~high",
				efforts: {
					off: null,
					minimal: "minimal",
					low: "low",
					medium: "medium",
					high: "high"
				},
				budgets: null
			},
			{
				id: "qwen",
				name: "Qwen / 通义",
				format: "qwen",
				supports: true,
				note: "off~high",
				efforts: {
					off: null,
					low: "low",
					medium: "medium",
					high: "high"
				},
				budgets: null
			},
			{
				id: "full",
				name: "全档位直通",
				format: "openai",
				supports: true,
				note: "off~max",
				efforts: {
					off: null,
					low: "low",
					medium: "medium",
					high: "high",
					xhigh: "xhigh",
					max: "max"
				},
				budgets: null
			},
			{
				id: "empty",
				name: "清空声明",
				format: null,
				supports: "unset",
				note: "沿用 catalog 默认",
				efforts: {},
				budgets: null
			}
		];
		//#endregion
		//#region src/client/api.ts
		/** Settings namespace hosting the llm-pi-ai provider profiles. */
		const SETTINGS_NS = "llm-pi-ai";
		/** Error carrying a user-readable failure text. */
		var PanelError = class extends Error {
			constructor(message) {
				super(message);
				this.name = "PanelError";
			}
		};
		/** Unwrap an RpcResult, throwing a PanelError on failure. */
		function unwrap(label, response) {
			if (!response.result.ok) {
				const raw = response.result.error;
				throw new PanelError(`${label}: ${typeof raw === "object" && raw !== null && typeof raw.message === "string" ? raw.message : String(raw ?? "unknown error")}`);
			}
			return response.result.value;
		}
		/**
		* API facade over the session wire + settings wire APIs.
		* `connection` is the injected connection handle (task-board pattern).
		*/
		var IntensityApi = class {
			connection;
			constructor(connection) {
				this.connection = connection;
			}
			/** Resolve the session used for model-directory calls (caller-supplied fallback). */
			async directory(sessionId) {
				const models = unwrap("models", await this.connection.api.sessions.models({ sessionId }));
				return {
					groups: models.groups.map((group) => ({
						provider: group.id,
						name: group.name,
						models: group.models.map((model) => ({
							provider: group.id,
							id: model.id,
							name: model.name,
							efforts: (model.reasoning?.efforts ?? []).map((e) => ({
								id: e.id,
								name: e.name
							})),
							hasReasoning: model.reasoning !== void 0 && model.reasoning !== null,
							defaultEffort: model.reasoning?.defaultEffort ?? null
						}))
					})),
					current: models.current ?? null
				};
			}
			/** Describe the settings document; returns the llm-pi-ai namespace view when registered. */
			async llmPiAiNamespace() {
				const desc = unwrap("settings.describe", await this.connection.api.settings.describe({}));
				const hit = desc.namespaces.find((ns) => ns.ns === SETTINGS_NS);
				if (hit === void 0) return null;
				return {
					view: hit,
					writable: desc.writable
				};
			}
			/**
			* Build the full config view for one provider/model from the directory +
			* settings document.
			*/
			async config(sessionId, provider, model) {
				const dir = await this.directory(sessionId);
				const current = dir.current;
				const isCurrent = current !== null && current.provider === provider && current.model === model;
				let item;
				for (const group of dir.groups) {
					const hit = group.models.find((m) => m.provider === provider && m.id === model);
					if (hit !== void 0) {
						item = hit;
						break;
					}
				}
				const view = {
					provider,
					model,
					modelName: item?.name ?? model,
					isCurrent,
					currentEffort: isCurrent ? current?.reasoningEffort ?? null : null,
					efforts: item?.efforts ?? [],
					hasReasoning: item?.hasReasoning ?? false,
					defaultEffort: item?.defaultEffort ?? null,
					error: item === void 0 ? "该模型不在当前目录中" : null,
					mapping: null,
					compat: {
						thinkingFormat: null,
						supportsReasoningEffort: null
					},
					budgets: null,
					canSave: false,
					revision: null
				};
				const ns = await this.llmPiAiNamespace();
				if (ns === null) return view;
				view.canSave = ns.writable;
				view.revision = ns.view.revision;
				const value = ns.view.value;
				const profile = (typeof value === "object" && value !== null ? value : {}).providers;
				if (typeof profile !== "object" || profile === null) return view;
				const entry = findEntry(profile, model);
				view.mapping = mappingView(entry);
				view.compat = compatView(profile, entry);
				view.budgets = budgetsView(profile);
				return view;
			}
			/** Switch the current model selection (and optionally its effort). */
			async select(sessionId, provider, model, reasoningEffort) {
				unwrap("selectModel", await this.connection.api.sessions.selectModel({
					sessionId,
					provider,
					model,
					...reasoningEffort === null ? {} : { reasoningEffort }
				}));
			}
			/**
			* Save a model's mapping config into the llm-pi-ai settings document.
			* models-list entries rebuild the whole list (settings.update, arrays
			* replace wholesale); modelOverrides entries use minimal path ops
			* (settings.mutate). Returns the fresh namespace view.
			*/
			async saveConfig(provider, model, payload, expectedRevision) {
				const ns = await this.llmPiAiNamespace();
				if (ns === null) throw new PanelError("未找到 llm-pi-ai 设置命名空间（llm-pi-ai 适配器未注册），无法写入");
				if (!ns.writable) throw new PanelError("settings 文档为只读，无法写入");
				const value = ns.view.value;
				const profile = (typeof value === "object" && value !== null ? value : {}).providers;
				const patch = effortPatch(payload);
				const inList = (profile !== void 0 ? findEntry(profile, model) : void 0)?.inList === true;
				const revisionArg = expectedRevision === null ? {} : { expectedRevision };
				if (inList) {
					const source = Array.isArray(profile?.models) ? profile.models : [];
					let found = false;
					const nextModels = source.map((raw) => {
						const entry = raw;
						if (entry.id !== model) return entry;
						found = true;
						return applyEntryPatch(entry, patch, payload);
					});
					if (!found) nextModels.push(applyEntryPatch({ id: model }, patch, payload));
					unwrap("settings.update", await this.connection.api.settings.update({
						ns: SETTINGS_NS,
						patch: { providers: { [provider]: { models: nextModels } } },
						...revisionArg
					}));
				} else {
					const modelBase = [
						"providers",
						provider,
						"modelOverrides",
						model
					];
					const ops = [];
					if (patch === false) ops.push({
						op: "set",
						path: [...modelBase, "reasoningEfforts"],
						value: false
					});
					else if (patch === null) ops.push({
						op: "unset",
						path: [...modelBase, "reasoningEfforts"]
					});
					else for (const level of LEVELS) if (patch[level] === void 0) ops.push({
						op: "unset",
						path: [
							...modelBase,
							"reasoningEfforts",
							level
						]
					});
					else ops.push({
						op: "set",
						path: [
							...modelBase,
							"reasoningEfforts",
							level
						],
						value: patch[level]
					});
					ops.push(...compatOps(modelBase, payload));
					ops.push(...budgetOps(provider, payload));
					if (ops.length > 0) unwrap("settings.mutate", await this.connection.api.settings.mutate({
						ns: SETTINGS_NS,
						ops,
						...revisionArg
					}));
				}
			}
		};
		/** Locate a model entry (models list first, then modelOverrides). */
		function findEntry(profile, model) {
			const list = profile.models;
			if (Array.isArray(list)) for (const raw of list) {
				const entry = raw;
				if (entry !== null && typeof entry === "object" && entry.id === model) return {
					entry,
					inList: true
				};
			}
			const overrides = profile.modelOverrides;
			if (typeof overrides === "object" && overrides !== null) {
				const hit = overrides[model];
				if (typeof hit === "object" && hit !== null) return {
					entry: hit,
					inList: false
				};
			}
			return {
				entry: null,
				inList: false
			};
		}
		/** Extract the mapping view from a model entry. */
		function mappingView(entry) {
			if (entry === null || entry.reasoningEfforts === void 0) return null;
			if (entry.reasoningEfforts === false) return {
				disabled: true,
				rows: []
			};
			const rows = [];
			const efforts = entry.reasoningEfforts;
			if (typeof efforts === "object" && efforts !== null) for (const level of LEVELS) {
				const wire = efforts[level];
				if (wire === void 0) continue;
				rows.push({
					level,
					wire: wire === null ? null : String(wire)
				});
			}
			return {
				disabled: false,
				rows
			};
		}
		/** Extract the compat view (model-level wins over provider-level). */
		function compatView(profile, entry) {
			const source = entry !== null && typeof entry.compat === "object" && entry.compat !== null ? entry.compat : typeof profile.compat === "object" && profile.compat !== null ? profile.compat : null;
			const view = {
				thinkingFormat: null,
				supportsReasoningEffort: null
			};
			if (source === null) return view;
			if (typeof source.thinkingFormat === "string") view.thinkingFormat = source.thinkingFormat;
			if (typeof source.supportsReasoningEffort === "boolean") view.supportsReasoningEffort = source.supportsReasoningEffort;
			return view;
		}
		/** Extract the provider-level thinkingBudgets table. */
		function budgetsView(profile) {
			const budgets = profile.thinkingBudgets;
			if (typeof budgets !== "object" || budgets === null) return null;
			const rows = [];
			for (const level of BUDGET_LEVELS) {
				const tokens = budgets[level];
				if (typeof tokens === "number") rows.push({
					level,
					tokens
				});
			}
			return rows.length === 0 ? null : rows;
		}
		/** Build the reasoningEfforts patch (false | declared dict | null to clear). */
		function effortPatch(payload) {
			if (payload.disable === true) return false;
			const dict = {};
			for (const level of LEVELS) {
				const wire = payload.efforts[level];
				if (wire === void 0) continue;
				dict[level] = wire === null || wire === "" ? null : String(wire);
			}
			if (Object.keys(dict).length === 0) return null;
			return dict;
		}
		/** Patch a list entry (wholesale-replacement semantics). */
		function applyEntryPatch(entry, patch, payload) {
			const next = { ...entry };
			if (patch === false) next.reasoningEfforts = false;
			else if (patch === null) delete next.reasoningEfforts;
			else next.reasoningEfforts = patch;
			const compat = payload.compat ?? {};
			const hasFormat = typeof compat.format === "string" && compat.format !== "";
			const hasSupports = typeof compat.supports === "boolean";
			if (hasFormat || hasSupports || compat.format === "" || compat.supports === "unset") {
				const merged = { ...typeof next.compat === "object" && next.compat !== null ? next.compat : {} };
				if (hasFormat) merged.thinkingFormat = compat.format;
				if (compat.format === "") delete merged.thinkingFormat;
				if (hasSupports) merged.supportsReasoningEffort = compat.supports;
				if (compat.supports === "unset") delete merged.supportsReasoningEffort;
				if (Object.keys(merged).length === 0) delete next.compat;
				else next.compat = merged;
			}
			return next;
		}
		/** Model-level compat path ops. */
		function compatOps(modelBase, payload) {
			const ops = [];
			const compat = payload.compat ?? {};
			if (typeof compat.format === "string") if (compat.format === "") ops.push({
				op: "unset",
				path: [
					...modelBase,
					"compat",
					"thinkingFormat"
				]
			});
			else ops.push({
				op: "set",
				path: [
					...modelBase,
					"compat",
					"thinkingFormat"
				],
				value: compat.format
			});
			if (compat.supports === true || compat.supports === false) ops.push({
				op: "set",
				path: [
					...modelBase,
					"compat",
					"supportsReasoningEffort"
				],
				value: compat.supports
			});
			if (compat.supports === "unset") ops.push({
				op: "unset",
				path: [
					...modelBase,
					"compat",
					"supportsReasoningEffort"
				]
			});
			return ops;
		}
		/** Provider-level thinkingBudgets path ops. */
		function budgetOps(provider, payload) {
			const ops = [];
			const budgets = payload.budgets;
			if (typeof budgets !== "object" || budgets === null) return ops;
			for (const level of BUDGET_LEVELS) {
				const value = budgets[level];
				if (value === void 0 || value === null) continue;
				if (value === "") {
					ops.push({
						op: "unset",
						path: [
							"providers",
							provider,
							"thinkingBudgets",
							level
						]
					});
					continue;
				}
				const number = Number(value);
				if (!Number.isFinite(number) || number < 0) throw new PanelError(`思考预算必须是非负数字: ${level}`);
				ops.push({
					op: "set",
					path: [
						"providers",
						provider,
						"thinkingBudgets",
						level
					],
					value: number
				});
			}
			return ops;
		}
		//#endregion
		//#region src/client/draft.ts
		/**
		* Mapping draft state and the pure functions that translate between the
		* wire view (config from settings/models APIs) and the editor draft, plus the
		* save payload the settings.mutate/update path consumes. Ported from the
		* dynamic-plugin version with identical semantics.
		*/
		/** Initialize a draft from a config view. */
		function initDraft(config) {
			const draft = {
				included: {},
				wire: {},
				disable: false,
				format: "",
				supports: "unset",
				budgets: {}
			};
			for (const level of LEVELS) {
				draft.included[level] = false;
				draft.wire[level] = "";
			}
			for (const level of BUDGET_LEVELS) draft.budgets[level] = "";
			if (config.mapping !== null) {
				draft.disable = config.mapping.disabled === true;
				for (const row of config.mapping.rows) {
					draft.included[row.level] = true;
					draft.wire[row.level] = row.wire === null ? "" : row.wire;
				}
			}
			if (config.compat !== null) {
				if (config.compat.thinkingFormat !== null) draft.format = config.compat.thinkingFormat;
				if (config.compat.supportsReasoningEffort !== null) draft.supports = config.compat.supportsReasoningEffort ? "true" : "false";
			}
			if (config.budgets !== null) for (const row of config.budgets) draft.budgets[row.level] = String(row.tokens);
			return draft;
		}
		/** Translate the draft into the save payload. */
		function payloadOf(draft) {
			const efforts = {};
			for (const level of LEVELS) {
				if (draft.included[level] !== true) continue;
				const wire = draft.wire[level].trim();
				efforts[level] = wire === "" ? null : wire;
			}
			const budgets = {};
			let budgetsTouched = false;
			for (const level of BUDGET_LEVELS) {
				const text = draft.budgets[level].trim();
				if (text === "") continue;
				budgetsTouched = true;
				budgets[level] = text;
			}
			return {
				disable: draft.disable,
				efforts,
				compat: {
					format: draft.format,
					supports: draft.supports === "unset" ? "unset" : draft.supports === "true"
				},
				budgets: budgetsTouched ? budgets : null
			};
		}
		/** Apply a mainstream preset to the draft. */
		function presetDraft(current, preset) {
			const next = {
				...current,
				included: { ...current.included },
				wire: { ...current.wire },
				budgets: { ...current.budgets }
			};
			for (const level of LEVELS) {
				const wire = preset.efforts[level];
				const has = wire !== void 0;
				next.included[level] = has;
				next.wire[level] = has ? wire === null ? "" : wire : "";
			}
			next.disable = preset.disable === true;
			if (preset.format !== void 0) next.format = preset.format === null ? "" : preset.format;
			if (preset.supports !== void 0) next.supports = preset.supports === null ? "unset" : preset.supports === true ? "true" : "false";
			if (preset.budgets !== null && preset.budgets !== void 0) for (const level of BUDGET_LEVELS) next.budgets[level] = preset.budgets[level] === void 0 ? "" : String(preset.budgets[level]);
			return next;
		}
		//#endregion
		//#region \0dsh-css:D:\Work\ToolsDev\DeepSeekHarnessPlugin\packages\dsh-thinking-intensity\src\client\panel.css.mjs
		const css = ".ddjm-shell {\n  display: flex;\n  gap: 12px;\n  align-items: flex-start;\n  font-size: 13px;\n  line-height: 20px;\n  color: var(--dsw-alias-label-primary);\n}\n\n.ddjm-side-wrap {\n  flex: none;\n  width: 230px;\n}\n\n.ddjm-side {\n  display: flex;\n  flex-direction: column;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: 10px;\n  padding: 8px;\n  max-height: 520px;\n  overflow: auto;\n}\n\n.ddjm-main {\n  flex: 1;\n  min-width: 0;\n}\n\n.ddjm-panel {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n  padding: 2px;\n}\n\n.ddjm-title {\n  font-size: 14px;\n  font-weight: 600;\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  flex-wrap: wrap;\n}\n\n.ddjm-group {\n  font-size: 11px;\n  font-weight: 600;\n  color: var(--dsw-alias-label-secondary);\n  padding: 8px 4px 2px;\n}\n\n.ddjm-model {\n  display: flex;\n  justify-content: space-between;\n  gap: 6px;\n  border: none;\n  background: none;\n  color: var(--dsw-alias-label-primary);\n  padding: 5px 8px;\n  border-radius: 6px;\n  cursor: pointer;\n  font-size: 12px;\n  text-align: left;\n  width: 100%;\n}\n\n.ddjm-model:hover {\n  background: var(--dsw-alias-bg-layer-2);\n}\n\n.ddjm-model-active {\n  background: var(--dsw-alias-bg-layer-2);\n  color: var(--dsw-alias-brand-primary);\n}\n\n.ddjm-row {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  align-items: center;\n}\n\n.ddjm-section {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: 10px;\n  padding: 10px;\n}\n\n.ddjm-btn {\n  border: 1px solid var(--dsw-alias-border-l1);\n  background: var(--dsw-alias-bg-layer-2);\n  color: var(--dsw-alias-label-primary);\n  border-radius: 8px;\n  padding: 5px 10px;\n  cursor: pointer;\n  font-size: 12px;\n  line-height: 18px;\n}\n\n.ddjm-btn:hover:not(:disabled) {\n  border-color: var(--dsw-alias-border-l2);\n}\n\n.ddjm-btn:disabled {\n  opacity: 0.55;\n  cursor: default;\n}\n\n.ddjm-active {\n  border-color: var(--dsw-alias-brand-primary) !important;\n  color: var(--dsw-alias-brand-primary);\n}\n\n.ddjm-save {\n  border-color: var(--dsw-alias-brand-primary);\n  color: var(--dsw-alias-brand-primary);\n}\n\n.ddjm-meta {\n  font-size: 12px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n.ddjm-error {\n  font-size: 12px;\n  color: var(--dsw-alias-state-error-primary);\n}\n\n.ddjm-badge {\n  font-size: 11px;\n  color: var(--dsw-alias-label-secondary);\n  font-weight: 400;\n}\n\n.ddjm-field {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n\n.ddjm-field-label {\n  font-size: 11px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n.ddjm-input {\n  border: 1px solid var(--dsw-alias-border-l1);\n  background: var(--dsw-alias-bg-base);\n  color: var(--dsw-alias-label-primary);\n  border-radius: 6px;\n  padding: 4px 8px;\n  font-size: 12px;\n  width: 130px;\n}\n\n.ddjm-select {\n  border: 1px solid var(--dsw-alias-border-l1);\n  background: var(--dsw-alias-bg-base);\n  color: var(--dsw-alias-label-primary);\n  border-radius: 6px;\n  padding: 4px 8px;\n  font-size: 12px;\n}\n\n.ddjm-num {\n  width: 80px;\n}\n\n.ddjm-level {\n  font-size: 12px;\n  color: var(--dsw-alias-label-primary);\n  min-width: 86px;\n}\n";
		const tagId = "dsh-thinking-intensity/panel.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-thinking-intensity";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region src/client/panel.tsx
		/**
		* Thinking-intensity manager panel: left model directory (grouped by
		* provider), right mapping editor for the selected model. Ported from the
		* dynamic-plugin version; data access via IntensityApi (session wire +
		* settings wire APIs), no host RPC.
		*/
		/** Combine a level id with its display name. */
		function effortLabel(id, name) {
			const cn = LEVEL_LABELS[id];
			if (cn === void 0) return name;
			return `${cn} · ${name}`;
		}
		/** Refresh button row. */
		function ReloadBar(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "ddjm-row",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: "ddjm-btn",
					onClick: props.onReload,
					children: "刷新"
				})
			});
		}
		/** One level mapping row (enable checkbox + wire-spelling input). */
		function LevelRow(props) {
			const included = props.draft.included[props.level];
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "ddjm-row",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: included,
						onChange: props.onToggle,
						disabled: props.busy
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "ddjm-level",
						children: [
							LEVEL_LABELS[props.level],
							" ",
							props.level
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						type: "text",
						className: "ddjm-input",
						value: props.draft.wire[props.level],
						placeholder: "留空 = 省略不发送",
						onChange: (e) => props.onWire(e.target.value),
						disabled: props.busy || !included
					})
				]
			});
		}
		/** Mainstream mapping preset dropdown. */
		function PresetRow(props) {
			const apply = (event) => {
				const hit = PRESETS.find((preset) => preset.id === event.target.value);
				if (hit === void 0) return;
				props.onApply(hit);
				event.target.value = "";
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "ddjm-row",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "ddjm-field-label",
					children: "主流映射预设"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
					className: "ddjm-select",
					onChange: apply,
					disabled: props.busy,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
						value: "",
						children: "选择主流映射预设…"
					}), PRESETS.map((preset) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("option", {
						value: preset.id,
						children: [
							preset.name,
							"（",
							preset.note,
							"）"
						]
					}, preset.id))]
				})]
			});
		}
		/** Compat switches row. */
		function CompatRow(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "ddjm-row",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "ddjm-field-label",
						children: "thinkingFormat"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
						className: "ddjm-select",
						value: props.draft.format,
						onChange: (e) => props.onField("format", e.target.value),
						disabled: props.busy,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
							value: "",
							children: "未设置"
						}), FORMATS.map((format) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
							value: format,
							children: format
						}, format))]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "ddjm-field-label",
						children: "supportsReasoningEffort"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
						className: "ddjm-select",
						value: props.draft.supports,
						onChange: (e) => props.onField("supports", e.target.value),
						disabled: props.busy,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: "unset",
								children: "未设置"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: "true",
								children: "是"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: "false",
								children: "否"
							})
						]
					})
				]
			});
		}
		/** Thinking-budget inputs row. */
		function BudgetRow(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "ddjm-row",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "ddjm-field-label",
					children: "thinkingBudgets (tokens)"
				}), BUDGET_LEVELS.map((level) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
					className: "ddjm-field",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "ddjm-field-label",
						children: level
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						type: "number",
						min: 0,
						className: "ddjm-input ddjm-num",
						value: props.draft.budgets[level],
						onChange: (e) => props.onBudget(level, e.target.value),
						disabled: props.busy,
						placeholder: "默认"
					})]
				}, level))]
			});
		}
		/** Quick effort switch for the current model. */
		function EffortStrip(props) {
			const buttons = [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: `ddjm-btn${props.cfg.currentEffort === null ? " ddjm-active" : ""}`,
				onClick: () => props.onPick(null),
				disabled: props.busy,
				children: "默认"
			}, "default")];
			for (const item of props.cfg.efforts) {
				const isCurrent = props.cfg.currentEffort === item.id;
				const isDefault = props.cfg.defaultEffort !== null && props.cfg.defaultEffort === item.id;
				buttons.push(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: `ddjm-btn${isCurrent ? " ddjm-active" : ""}`,
					onClick: () => props.onPick(item.id),
					disabled: props.busy,
					children: [effortLabel(item.id, item.name), isDefault ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "ddjm-badge",
						children: " 默认"
					}) : null]
				}, item.id));
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "ddjm-row",
				children: buttons
			});
		}
		/** Left model directory pane. */
		function ModelPane(props) {
			const rows = [];
			for (const group of props.dir.groups) {
				rows.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "ddjm-group",
					children: group.name
				}, group.provider));
				for (const model of group.models) {
					const isCurrent = props.dir.current !== null && props.dir.current.provider === group.provider && props.dir.current.model === model.id;
					const isSelected = props.sel !== null && props.sel.provider === group.provider && props.sel.model === model.id;
					rows.push(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `ddjm-model${isSelected ? " ddjm-model-active" : ""}`,
						onClick: () => props.onSelect(group.provider, model.id),
						children: [model.name, isCurrent ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "ddjm-badge",
							children: "当前"
						}) : null]
					}, `${group.provider}:${model.id}`));
				}
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "ddjm-side",
				children: rows
			});
		}
		/** Editor body: everything the right pane renders. */
		function EditorBody(props) {
			const cfg = props.cfg;
			const note = props.note === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: props.note.includes("失败") ? "ddjm-error" : "ddjm-meta",
				children: props.note
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "ddjm-panel",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "ddjm-title",
						children: [cfg.modelName, /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "ddjm-badge",
							children: [
								"· ",
								cfg.provider,
								cfg.isCurrent ? " · 当前使用" : ""
							]
						})]
					}),
					cfg.error !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "ddjm-error",
						children: cfg.error
					}) : null,
					cfg.hasReasoning === false ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "ddjm-meta",
						children: "该模型未声明思维强度档位。"
					}) : null,
					cfg.isCurrent ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(EffortStrip, {
						cfg,
						busy: props.busy,
						onPick: props.onPick
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "ddjm-row",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ddjm-btn",
							onClick: () => props.onPick(null),
							disabled: props.busy,
							children: "设为当前模型"
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(PresetRow, {
						busy: props.busy,
						onApply: props.onPreset
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "ddjm-section",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "ddjm-meta",
							children: "档位映射（键 = 界面档位，值 = 发送给网关的拼写）"
						}), LEVELS.map((level) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LevelRow, {
							level,
							draft: props.draft,
							busy: props.busy,
							onToggle: () => props.onToggle(level),
							onWire: (value) => props.onWire(level, value)
						}, level))]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "ddjm-row",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: props.draft.disable,
							onChange: props.onDisable,
							disabled: props.busy
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "禁用该模型推理 (reasoningEfforts: false)" })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(CompatRow, {
						draft: props.draft,
						busy: props.busy,
						onField: props.onField
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BudgetRow, {
						draft: props.draft,
						busy: props.busy,
						onBudget: props.onBudget
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "ddjm-row",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ddjm-btn ddjm-save",
								onClick: props.onSave,
								disabled: props.busy || cfg.canSave !== true,
								children: props.busy ? "保存中…" : "保存映射配置"
							}),
							cfg.canSave !== true ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "ddjm-meta",
								children: "设置文档不可写"
							}) : null,
							note
						]
					})
				]
			});
		}
		/** Config editor: draft state + save/switch logic. */
		function ConfigEditor(props) {
			const [draft, setDraft] = (0, react.useState)(() => initDraft(props.cfg));
			const [busy, setBusy] = (0, react.useState)(false);
			const [note, setNote] = (0, react.useState)(null);
			const save = (0, react.useCallback)(async () => {
				setBusy(true);
				setNote(null);
				try {
					if (props.sessionId === null) throw new Error("当前没有活动会话");
					await props.api.saveConfig(props.cfg.provider, props.cfg.model, payloadOf(draft), props.cfg.revision);
					const fresh = await props.api.config(props.sessionId, props.cfg.provider, props.cfg.model);
					setDraft(initDraft(fresh));
					props.onSaved(fresh);
					setNote("已保存到 settings 文档");
				} catch (err) {
					setNote(`保存失败: ${err instanceof Error ? err.message : String(err)}`);
				}
				setBusy(false);
			}, [props, draft]);
			const pick = (0, react.useCallback)(async (effort) => {
				setBusy(true);
				setNote(null);
				try {
					if (props.sessionId === null) throw new Error("当前没有活动会话");
					await props.api.select(props.sessionId, props.cfg.provider, props.cfg.model, effort);
					const fresh = await props.api.config(props.sessionId, props.cfg.provider, props.cfg.model);
					props.onSaved(fresh);
					setNote(effort === null ? "已切换当前模型（提供方默认强度）" : `当前强度已切换: ${effort}`);
				} catch (err) {
					setNote(`切换失败: ${err instanceof Error ? err.message : String(err)}`);
				}
				setBusy(false);
			}, [props]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(EditorBody, {
				cfg: props.cfg,
				draft,
				busy,
				note,
				onSave: save,
				onPick: pick,
				onPreset: (preset) => setDraft(presetDraft(draft, preset)),
				onToggle: (level) => setDraft({
					...draft,
					included: {
						...draft.included,
						[level]: !draft.included[level]
					}
				}),
				onWire: (level, value) => setDraft({
					...draft,
					wire: {
						...draft.wire,
						[level]: value
					}
				}),
				onDisable: () => setDraft({
					...draft,
					disable: !draft.disable
				}),
				onField: (key, value) => setDraft({
					...draft,
					[key]: value
				}),
				onBudget: (level, value) => setDraft({
					...draft,
					budgets: {
						...draft.budgets,
						[level]: value
					}
				})
			});
		}
		/**
		* The panel: two-column layout (left directory, right editor). Loads the
		* directory on mount and on refresh; selects the current model initially.
		*/
		function IntensityManager(props) {
			const [dir, setDir] = (0, react.useState)(null);
			const [dirError, setDirError] = (0, react.useState)(null);
			const [sel, setSel] = (0, react.useState)(null);
			const [cfg, setCfg] = (0, react.useState)(null);
			const [cfgError, setCfgError] = (0, react.useState)(null);
			const sessionId = props.sessionId;
			const loadDir = (0, react.useCallback)(async () => {
				if (sessionId === null) {
					setDirError("当前没有活动会话");
					return null;
				}
				try {
					const data = await props.api.directory(sessionId);
					setDir(data);
					setDirError(null);
					return data;
				} catch (err) {
					setDirError(err instanceof Error ? err.message : String(err));
					return null;
				}
			}, [props.api, sessionId]);
			const loadCfg = (0, react.useCallback)(async (provider, model) => {
				if (sessionId === null) {
					setCfgError("当前没有活动会话");
					return;
				}
				try {
					const data = await props.api.config(sessionId, provider, model);
					setCfg(data);
					setCfgError(null);
				} catch (err) {
					setCfgError(err instanceof Error ? err.message : String(err));
				}
			}, [props.api, sessionId]);
			const reload = (0, react.useCallback)(async () => {
				const data = await loadDir();
				if (data === null || data.current === null) return;
				const target = sel ?? {
					provider: data.current.provider,
					model: data.current.model
				};
				setSel(target);
				await loadCfg(target.provider, target.model);
			}, [
				loadDir,
				loadCfg,
				sel
			]);
			const boot = (0, react.useCallback)(async () => {
				const data = await loadDir();
				if (data === null || data.current === null) return;
				const target = {
					provider: data.current.provider,
					model: data.current.model
				};
				setSel(target);
				await loadCfg(target.provider, target.model);
			}, [loadDir, loadCfg]);
			(0, react.useEffect)(() => {
				boot();
			}, []);
			const select = (0, react.useCallback)((provider, model) => {
				setSel({
					provider,
					model
				});
				loadCfg(provider, model);
			}, [loadCfg]);
			const saved = (0, react.useCallback)((fresh) => {
				setCfg(fresh);
				loadDir();
			}, [loadDir]);
			const left = dir === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: dirError !== null ? "ddjm-error" : "ddjm-meta",
				children: dirError !== null ? dirError : "加载模型清单…"
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelPane, {
				dir,
				sel,
				onSelect: select
			});
			const right = cfg === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: cfgError !== null ? "ddjm-error" : "ddjm-meta",
				children: cfgError !== null ? cfgError : "加载配置…"
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ConfigEditor, {
				cfg,
				sessionId: props.sessionId,
				api: props.api,
				onSaved: saved
			}, `${cfg.provider}:${cfg.model}`);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "ddjm-panel",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ReloadBar, { onReload: () => void reload() }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "ddjm-shell",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "ddjm-side-wrap",
						children: left
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "ddjm-main",
						children: right
					})]
				})]
			});
		}
		//#endregion
		//#region src/client/index.ts
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
		/** Locale namespace this plugin owns (also the settings namespace). */
		const NS = "thinking-intensity";
		/** Required services (fiber inject waiting — the runtime must be up first). */
		const inject = [
			"slots",
			"locale",
			"connection"
		];
		/**
		* Mount the thinking-intensity settings section.
		* @param ctx - client root context (slots + locale services).
		*/
		function apply(ctx) {
			const connection = ctx.get("connection");
			if (connection === void 0) {
				console.warn("[dsh-thinking-intensity] connection service unavailable; panel disabled");
				return;
			}
			const api = new IntensityApi(connection);
			ctx.effect(() => ctx.locale.register(NS, {
				zh: {},
				en: {}
			}), "thinking-intensity: dictionaries");
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "thinking-intensity",
				order: 12,
				label: () => "思维强度"
			}, (props) => {
				const sessionId = props.useSessions((s) => s.current);
				return react.default.createElement(IntensityManager, {
					api,
					sessionId: sessionId ?? null
				});
			}));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map