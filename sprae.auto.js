import sprae from "./sprae.js";

// standalone run
if (typeof document != "undefined" && document?.currentScript) {
    window.sprae = sprae
    if (document.currentScript.hasAttribute('init')) sprae(document.documentElement);
  }
  