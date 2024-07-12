import esbuild from "esbuild";
import { umdWrapper } from "esbuild-plugin-umd-wrapper"

// ESM build
const options = {
  entryPoints: ["sprae.js"],
  outfile: "dist/sprae.js",
  format: "esm",
  bundle: true,
  target: 'es2020',
  sourcemap: 'external'
}

esbuild.build(options)
esbuild.build({
  ...options,
  outfile: "dist/sprae.min.js",
  minify: true,
})

// UMD build
const umdOptions = {
  ...options,
  outfile: "dist/sprae.umd.js",
  format: "umd",
  footer: {
    // autoinit
    js: `if (document?.currentScript?.hasAttribute('init')) sprae(document.documentElement)`
  },
  plugins: [umdWrapper({
    libraryName: "sprae"
  })],
}

esbuild.build(umdOptions)
esbuild.build({
  ...umdOptions,
  minify: true
})
