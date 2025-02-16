// autonomous standalone sprae version - expected to run via CDN, CJS or AMD

const { default: sprae } = require("./sprae.js");

// expose global
module.exports = sprae

// autoinit if wanted
if (document.currentScript?.hasAttribute('init')) {
  const props = JSON.parse(document.currentScript?.getAttribute('init') || '{}')
  const init = () => { sprae(document.documentElement, props) };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}
