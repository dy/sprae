import { attr, dashcase } from "../core.js";

export default (target) => value => { for (let key in value) attr(target, dashcase(key), value[key]) }
