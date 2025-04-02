import esbuild from "esbuild";
import { umdWrapper } from "esbuild-plugin-umd-wrapper"

// ESM build
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
  outfile: "dist/sprae.min.js",
  sourcemap: 'external',
  minify: true
})

// UMD build
await esbuild.build({
  stdin: {
    contents: `module.exports = require("./sprae.js").default;`,
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
  outfile: "dist/sprae.umd.min.js",
  sourcemap: 'external',
  minify: true
})

// Autoinit build
await esbuild.build({
  stdin: {
    contents: 'const sprae = require("./sprae.js").default;\n' +
    'sprae.use({prefix: document.currentScript.getAttribute("prefix")});\n' +
    'document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => sprae()) : sprae();\n' +
    'module.exports = require("./sprae.js").default;',
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
  outfile: "dist/sprae.auto.min.js",
  sourcemap: 'external',
  minify: true
})
