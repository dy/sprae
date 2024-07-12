import esbuild from "esbuild";
import { umdWrapper } from "esbuild-plugin-umd-wrapper"

esbuild
  .build({
    entryPoints: ["sprae.js"],
    outfile: "dist/sprae.js",
    format: "esm",
    bundle: true,
    target: 'es2020'
  })

esbuild.build({
  entryPoints: ["sprae.js"],
  outfile: "dist/sprae.min.js",
  format: "esm",
  bundle: true,
  minify: true,
  target: 'es2020'
})

esbuild.build({
  entryPoints: ["sprae.js"],
  outfile: "dist/sprae.umd.js",
  format: "umd",
  bundle: true,
  target: 'es2020',
  plugins: [umdWrapper({
    libraryName: "sprae"
  })],
})
  .catch(() => process.exit(1));
