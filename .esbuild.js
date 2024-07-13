import esbuild from "esbuild";
import { umdWrapper } from "esbuild-plugin-umd-wrapper"

/** @type {import("esbuild").BuildOptions} */
const commonOptions = {
  bundle: true,
  target: 'es2020',
  sourcemap: 'external'
}

// ESM build
const options = {
  ...commonOptions,
  entryPoints: ["sprae.js"],
  outfile: "dist/sprae.js",
  format: "esm",
}

esbuild.build(options)
esbuild.build({
  ...options,
  outfile: "dist/sprae.min.js",
  minify: true,
})

// UMD build
const umdOptions = {
  ...commonOptions,
  entryPoints: ["sprae.umd.cjs"],
  outfile: "dist/sprae.umd.js",
  format: "umd",
  plugins: [umdWrapper({
    libraryName: "sprae",
  })],
}

esbuild.build(umdOptions)
esbuild.build({
  ...umdOptions,
  outfile: "dist/sprae.umd.min.js",
  minify: true
})
