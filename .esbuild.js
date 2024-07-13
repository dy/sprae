import esbuild from "esbuild";

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
  entryPoints: ["sprae.js"],
  outfile: "dist/sprae.umd.js",
  bundle: true,
  target: 'es2020',
  sourcemap: 'external',
  format: "iife"
})
esbuild.build({
  entryPoints: ['dist/sprae.umd.js'],
  outfile: "dist/sprae.umd.min.js",
  sourcemap: 'external',
  minify: true
})
