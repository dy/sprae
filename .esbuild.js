import esbuild from "esbuild";
import { umdWrapper } from "esbuild-plugin-umd-wrapper"


// ESM bundle
await esbuild.build({
  entryPoints: ["sprae.js"],
  outfile: "dist/sprae.js",
  format: "esm",
  bundle: true,
  minify: true,
  target: 'es2020',
  sourcemap: 'external'
})


// UMD with autoinit
await esbuild.build({
  stdin: {
    contents:
    'var sprae = require("./sprae.js").default;\n' +
    'sprae.store = require("./store.js").default;\n' +
    'sprae.prefix=document.currentScript.getAttribute("prefix")||document.currentScript.dataset.spraePrefix||":";\n' +
    'if (!document.currentScript.hasAttribute("inert")) document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => sprae()) : sprae();\n' +
    'module.exports = sprae;',
    resolveDir: '.'
  },
  outfile: "dist/sprae.umd.js",
  bundle: true,
  minify: true,
  target: 'es2020',
  sourcemap: 'external',
  format: "umd",
  plugins: [umdWrapper({
    libraryName: "sprae"
  })]
})


// micro bundle
await esbuild.build({
  stdin: {
    contents: `
    import sprae, { dir, parse } from './core.js'
    import store from './store.js'

    import _scope from './directive/scope.js'
    import _fx from './directive/fx.js'
    import _attr from './directive/attr.js'
    import _on from './directive/on.js'

    dir('ref', el => f => f(el)) // simplified fn ref
    dir('scope', _scope)
    dir('fx', _fx)
    dir('*', (e, s, x, n) => (n[0].startsWith('on') ? _on : _attr)(e, s, x, n))

    sprae.compile = expr => Function(\`with (arguments[0]) { return \${expr} };\`)

    export default sprae
    `,
    resolveDir: '.'
  },
  outfile: "dist/sprae.micro.js",
  bundle: true,
  minify: true,
  sourcemap: 'external',
  format: "esm",
})
