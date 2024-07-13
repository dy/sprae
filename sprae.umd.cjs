import { default as sprae } from "./sprae.js";

module.exports = sprae;

if (document?.currentScript?.hasAttribute("init")) sprae(document.documentElement);