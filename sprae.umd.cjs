// autonomous standalone sprae version - expected to run via CDN, CJS or AMD

const { default: sprae } = require("./sprae.js");

// autoinit if wanted
const script = document.currentScript

if (script) {
  const $ = script.getAttribute('init')
  const init = () => document.querySelectorAll($ || 'body').forEach(el => sprae(el));
  sprae.use({prefix: script.getAttribute('prefix')});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}

// expose global
module.exports = sprae
