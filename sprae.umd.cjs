// autonomous standalone sprae version - expected to run via CDN, CJS or AMD

const { default: sprae } = require("./sprae.js");

// autoinit if wanted
const config = document.currentScript?.getAttribute('init')
if (config != null) {
  const props = JSON.parse(config || '{}')
  const init = () => { sprae(document.body, props) };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}

// expose global
module.exports = sprae
