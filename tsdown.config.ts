import { readFile } from 'node:fs/promises'
import { basename, dirname, resolve as resolvePath, sep } from 'node:path'
import type { UserConfig } from 'tsdown'

/**
 * Dual-face bundle config, modeled on the dsh-web-ui family preset
 * (shared/tsdown.client.ts):
 * - "." → lib/index.js    Host half: node ESM, @deepseek-ai/* + schemastery
 *   stay external (resolved from the profile tree at runtime).
 * - "./client" → lib/client.js  Browser half: CJS bundle wrapped in
 *   window.__ModuleLoader__.load({id, factory}) with react / react-dom /
 *   cordis resolved through the injected require (loader module table).
 *
 * Plain .css imports are inlined as an injected <style data-plugin> tag
 * (module CSS virtualization, same pattern as the family preset; no CSS
 * Modules hashing — this package uses one plain stylesheet).
 */

/** Package id stamped into the __ModuleLoader__ handoff and style tags. */
const ID = 'dsh-thinking-intensity'

/** Browser platform modules resolved from the loader module table. */
const CLIENT_EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
]

/** Inline-safe wire layers a client bundle may bundle. */
const INLINE_SAFE = /^@deepseek-ai\/dsh-(host-apiproxy|session|llm|tools|brand)(\/|$)/

/** Virtual-id wrapper keeping plain CSS away from tsdown's own css pipeline. */
const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

/** tsdown/rolldown virtual ids carry a NUL prefix; strip it for file paths. */
function fileIdOf(virtualId: string): string {
  return virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
}

/** Client bundle config (format cjs + browser + ModuleLoader wrapper). */
function clientConfig(): UserConfig {
  return {
    name: `${ID}/client`,
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    sourcemap: true,
    clean: false,
    external: [...CLIENT_EXTERNALS],
    // Inline everything not in the loader module table (wire layers, our own
    // code). A require() the table cannot answer is a runtime throw, so the
    // rule is the table list itself.
    noExternal: (source: string) => (CLIENT_EXTERNALS.includes(source) ? undefined : true),
    plugins: [
      {
        // Bundle purity gate: only platform modules stay external; inline-safe
        // wire layers inline; any other @deepseek-ai value import is an error
        // (type-only imports are erased and never reach this gate).
        name: 'dsh-client-bundle-purity',
        resolveId(source: string) {
          if (!source.startsWith('@deepseek-ai/')) return null
          if (CLIENT_EXTERNALS.includes(source)) return null
          if (INLINE_SAFE.test(source)) return null
          throw new Error(
            `client bundle purity: "${source}" is not a platform module or inline-safe wire layer — ` +
              'cross-plugin value imports are forbidden; use cordis services (type-only imports are erased)',
          )
        },
      },
      {
        // Inline plain .css as an injected <style data-plugin> tag.
        name: 'dsh-css-inline',
        resolveId(source: string, importer: string | undefined) {
          if (!source.endsWith('.css')) return null
          const abs =
            importer !== undefined ? resolvePath(dirname(importer), source) : source
          return CSS_VIRTUAL_PREFIX + abs + CSS_VIRTUAL_SUFFIX
        },
        async load(virtualId: string) {
          if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
          const fileId = fileIdOf(virtualId)
          this.addWatchFile(fileId)
          const css = await readFile(fileId, 'utf8')
          const tagId = `${ID}/${basename(fileId)}`
          return [
            `const css = ${JSON.stringify(css)};`,
            `const tagId = ${JSON.stringify(tagId)};`,
            `if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {`,
            `  const tag = document.createElement('style');`,
            `  tag.dataset.plugin = ${JSON.stringify(ID)};`,
            '  tag.dataset.pluginCss = tagId;',
            '  tag.textContent = css;',
            '  document.head.appendChild(tag);',
            '}',
            'export default null;',
          ].join('\n')
        },
      },
    ],
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  }
}

/** Host-half config (node ESM). */
function hostConfig(): UserConfig {
  return {
    name: ID,
    // Object form pins the output name (array form would emit index.mjs).
    entry: { index: 'src/index.ts' },
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    dts: false,
    clean: false,
    external: ['@deepseek-ai/cordis', '@deepseek-ai/dsh-settings', '@deepseek-ai/dsh-system-prompt', 'schemastery'],
    outputOptions: {
      // Force lib/index.js (package.json main/exports point there; the esm
      // default would emit index.mjs).
      entryFileNames: 'index.js',
    },
  }
}

export default [hostConfig(), clientConfig()]
