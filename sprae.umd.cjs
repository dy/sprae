// autonomous standalone sprae version - expected to run via CDN, CJS or AMD

const { default: sprae } = require("./sprae.js");

// expose global
module.exports = sprae

// autoinit if wanted
const init = document.currentScript?.getAttribute('init') || null
if (init) sprae(document.documentElement, JSON.parse(init));
