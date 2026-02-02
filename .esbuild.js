import esbuild from "esbuild";
import { umdWrapper } from "esbuild-plugin-umd-wrapper"
import pkg from './package.json' with { type: 'json' };

// ESM bundle
await esbuild.build({
  entryPoints: ["sprae.js"],
  outfile: "dist/sprae.js",
  format: "esm",
  bundle: true,
  minify: true,
  target: 'es2020',
  define: { '__VERSION__': JSON.stringify(pkg.version) },
  sourcemap: 'external'
})


// UMD with autoinit
await esbuild.build({
  stdin: {
    contents:
      // MO immediately applies spraeable elements
      // Note: read prefix/start BEFORE using them, then remove data-attrs to prevent self-processing
      `var sprae = require("./sprae.js").default; module.exports = sprae; var cur = document.currentScript;
var prefix = cur.getAttribute("prefix") ?? cur.dataset.prefix ?? cur.dataset.spraePrefix;
var start = cur.getAttribute("start") ?? cur.dataset.start ?? cur.dataset.spraeStart;
cur.removeAttribute("prefix"); cur.removeAttribute("start"); delete cur.dataset.prefix; delete cur.dataset.start; delete cur.dataset.spraePrefix; delete cur.dataset.spraeStart;
if (prefix) sprae.use({ prefix });
if (start != null && start !== 'false') (start && start !== 'true' ? document.querySelectorAll(start) : [document.body || document.documentElement]).forEach(el => sprae.start(el))`,
    resolveDir: '.'
  },
  outfile: "dist/sprae.umd.js",
  bundle: true,
  minify: true,
  target: 'es2020',
  sourcemap: 'external',
  format: "umd",
  define: { '__VERSION__': JSON.stringify(pkg.version) },
  plugins: [
    umdWrapper({
      libraryName: "sprae"
    })
  ]
})
