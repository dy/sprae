import esbuild from "esbuild";
import {rollup} from "rollup";

// ESM build
const esmOptions = {
    entryPoints: ["sprae.js"],
    outfile: "dist/sprae.js",
    format: "esm",
    bundle: true,
    target: 'es2020',
    sourcemap: 'external'
}

await esbuild.build(esmOptions)
await esbuild.build({
    ...esmOptions,
    outfile: "dist/sprae.min.js",
    minify: true,
})

// ESM build with auto init
const esmInitOptions = {
    ...esmOptions,
    entryPoints: ["sprae.init.js"],
    outfile: "dist/sprae.init.js",
}

await esbuild.build(esmInitOptions)
await esbuild.build({
    ...esmInitOptions,
    outfile: "dist/sprae.init.min.js",
    minify: true,
})

// UMD build
const umdOptions = {
    format: 'umd',
    name: 'sprae',
    sourcemap: 'hidden',
    compact: true,
}
await rollup({input: 'dist/sprae.init.js'}).then(b => b.write({
    ...umdOptions,
    file: 'dist/sprae.umd.js',
}))
await rollup({input: 'dist/sprae.init.min.js'}).then(b => b.write({
    ...umdOptions,
    file: 'dist/sprae.umd.min.js',
}))
