import { dir } from "../core.js";

dir('data', el => value => {for (let key in value) el.dataset[key] = value[key];})
