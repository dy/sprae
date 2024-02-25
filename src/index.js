import sprae from "./core.js";
import "./directives.js";
export default sprae;
export * from "./signal.js";

// autoinit
if (document.currentScript) sprae(document.documentElement);
