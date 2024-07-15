// autonomous standalone sprae version - expected to run via CDN, CJS or AMD

const { default: sprae } = require("./sprae.js");

// include everything
require('./directive/data.js');
require('./directive/aria.js');
require('./directive/html.js');

// expose global
module.exports = sprae

// autoinit if wanted
if (document.currentScript?.hasAttribute('init')) sprae(document.documentElement);
