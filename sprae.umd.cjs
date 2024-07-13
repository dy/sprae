import { default as sprae } from "./sprae.js";

module.exports = sprae;

if (typeof document !== "undefined" && document?.currentScript?.hasAttribute("init")) sprae(document.documentElement);