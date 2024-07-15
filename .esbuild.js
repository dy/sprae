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

// Standalone build
await esbuild.build({
  entryPoints: ["sprae.umd.cjs"],
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
