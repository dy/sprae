// autonomous standalone sprae version - expected to run via CDN, CJS or AMD

const { default: sprae } = require("./sprae.js");

// include everything
require('./directive/data.js');
require('./directive/aria.js');
require('./directive/html.js');

// expose global
module.exports = sprae

// autoinit if wanted
const init = document.currentScript?.getAttribute('init') || null
if (init) sprae(document.documentElement, JSON.parse(init));
