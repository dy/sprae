import esbuild from "esbuild";
import { umdWrapper } from "esbuild-plugin-umd-wrapper"


// ESM bundle
await esbuild.build({
  entryPoints: ["sprae.js"],
  outfile: "dist/sprae.js",
  format: "esm",
  bundle: true,
  target: 'es2020',
  sourcemap: 'external'
})
esbuild.build({
  entryPoints: ['dist/sprae.js'],
  outfile: "dist/sprae.js",
  sourcemap: 'external',
  minify: true,
  allowOverwrite: true
})


// UMD
await esbuild.build({
  stdin: {
    contents:
    `var sprae = require("./sprae.js").default;\n` +
    'sprae.store = require("./store.js").default;\n' +
    'module.exports = sprae;',
    resolveDir: '.'
  },
  outfile: "dist/sprae.umd.js",
  bundle: true,
  target: 'es2020',
  sourcemap: 'external',
  format: "umd",
  plugins: [umdWrapper({
    libraryName: "sprae"
  })]
})
esbuild.build({
  entryPoints: ['dist/sprae.umd.js'],
  outfile: "dist/sprae.umd.js",
  sourcemap: 'external',
  minify: true,
  allowOverwrite: true
})


// Autoinit
await esbuild.build({
  stdin: {
    contents: 'var sprae = require("./sprae.js").default;\n' +
    'sprae.store = require("./store.js").default;\n' +
    'sprae.use({prefix: document.currentScript.getAttribute("prefix")});\n' +
    'document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => sprae()) : sprae();\n' +
    'module.exports = sprae;',
    resolveDir: '.'
  },
  outfile: "dist/sprae.auto.js",
  bundle: true,
  target: 'es2020',
  sourcemap: 'external',
  format: "umd",
  plugins: [umdWrapper({
    libraryName: "sprae"
  })]
})
esbuild.build({
  entryPoints: ['dist/sprae.auto.js'],
  outfile: "dist/sprae.auto.js",
  sourcemap: 'external',
  minify: true,
  allowOverwrite: true
})


// micro bundle
await esbuild.build({
  stdin: {
    contents: `
    import sprae, { dir, parse } from './core.js'
    import store from './store.js'

    import _with from './directive/with.js'
    import _fx from './directive/fx.js'
    import _any from './directive/any.js'
    import _on from './directive/on.js'

    dir('ref', el => f => f(el)) // simplified fn ref
    dir('with', _with)
    dir('fx', _fx)
    dir('*', (e, s, x, n) => (n[0].startsWith('on') ? _on : _any)(e, s, x, n))

    sprae.compile = expr => Function(\`with (arguments[0]) { return \${expr} };\`)
    export default sprae
    `,
    resolveDir: '.'
  },
  outfile: "dist/sprae.micro.js",
  bundle: true,
  target: 'es2020',
  sourcemap: 'external',
  format: "esm",
})
esbuild.build({
  entryPoints: ['dist/sprae.micro.js'],
  outfile: "dist/sprae.micro.js",
  sourcemap: 'external',
  minify: true,
  allowOverwrite: true
})
