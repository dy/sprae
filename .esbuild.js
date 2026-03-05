import esbuild from "esbuild";
import { umdWrapper } from "esbuild-plugin-umd-wrapper"
import pkg from './package.json' with { type: 'json' };

const common = {
  bundle: true,
  minify: true,
  target: 'es2020',
  define: { '__VERSION__': JSON.stringify(pkg.version) },
  sourcemap: 'external'
}

const umd = (libraryName) => ({
  ...common,
  format: "umd",
  plugins: [umdWrapper({ libraryName })]
})

const umdAutoinit = `var cur = document.currentScript;
var prefix = cur.getAttribute("prefix") ?? cur.dataset.prefix ?? cur.dataset.spraePrefix;
var start = cur.getAttribute("start") ?? cur.dataset.start ?? cur.dataset.spraeStart;
cur.removeAttribute("prefix"); cur.removeAttribute("start"); delete cur.dataset.prefix; delete cur.dataset.start; delete cur.dataset.spraePrefix; delete cur.dataset.spraeStart;
if (prefix) sprae.use({ prefix });
if (start != null && start !== 'false') (start && start !== 'true' ? document.querySelectorAll(start) : [document.body || document.documentElement]).forEach(el => sprae.start(el))`

await Promise.all([
  // default: built-in signals + new Function compiler
  esbuild.build({ entryPoints: ["sprae.js"], outfile: "dist/sprae.js", format: "esm", ...common }),
  esbuild.build({
    stdin: { contents: `var sprae = require("./sprae.js").default; module.exports = sprae; ${umdAutoinit}`, resolveDir: '.' },
    outfile: "dist/sprae.umd.js", ...umd("sprae")
  }),

  // csp: built-in signals + jessie compiler (no eval)
  esbuild.build({
    stdin: { contents: `import sprae from "./sprae.js"; import jessie from "subscript/jessie"; sprae.use({ compile: jessie }); export * from "./sprae.js"; export default sprae`, resolveDir: '.' },
    outfile: "dist/sprae-csp.js", format: "esm", ...common
  }),
  esbuild.build({
    stdin: { contents: `var sprae = require("./sprae.js").default; var jessie = require("subscript/jessie"); sprae.use({ compile: jessie }); module.exports = sprae; ${umdAutoinit}`, resolveDir: '.' },
    outfile: "dist/sprae-csp.umd.js", ...umd("sprae")
  }),

  // preact: preact signals + new Function compiler
  esbuild.build({
    stdin: { contents: `import sprae, { use } from "./sprae.js"; import * as signals from "@preact/signals-core"; use(signals); export * from "./sprae.js"; export default sprae`, resolveDir: '.' },
    outfile: "dist/sprae-preact.js", format: "esm", ...common
  }),
  esbuild.build({
    stdin: { contents: `var sprae = require("./sprae.js").default; var signals = require("@preact/signals-core"); var use = require("./core.js").use; use(signals); module.exports = sprae; ${umdAutoinit}`, resolveDir: '.' },
    outfile: "dist/sprae-preact.umd.js", ...umd("sprae")
  }),
])
