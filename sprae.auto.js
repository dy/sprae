// standalone sprae version - expected to run via CDN

import sprae from "./sprae.js";

window.sprae = sprae
if (document.currentScript?.hasAttribute('init')) sprae(document.documentElement);
