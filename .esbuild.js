import esbuild from "esbuild";
import { umdWrapper } from "esbuild-plugin-umd-wrapper"

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

esbuild.build({
  ...options,
  outfile: "dist/sprae.umd.js",
  format: "umd",
  plugins: [umdWrapper({
    libraryName: "sprae"
  })],
})

esbuild.build({
  ...options,
  outfile: "dist/sprae.umd.min.js",
  format: "umd",
  minify: true,
  plugins: [umdWrapper({
    libraryName: "sprae"
  })],
})
