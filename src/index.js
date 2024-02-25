import sprae from "./core.js";
import "./directives.js";
export default sprae;
export * from "./core.js";

// autoinit
if (document.currentScript) sprae(document.documentElement);
