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

// Standalone build
await esbuild.build({
  entryPoints: ["sprae.js"],
  outfile: "dist/sprae.auto.js",
  bundle: true,
  target: 'es2020',
  sourcemap: 'external',
  format: "iife"
})
esbuild.build({
  entryPoints: ['dist/sprae.auto.js'],
  outfile: "dist/sprae.auto.min.js",
  sourcemap: 'external',
  minify: true
})
