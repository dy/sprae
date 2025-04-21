import {dashcase, attr} from '../core.js'
// :="{a,b,c}"

export default (target) => value => { for (let key in value) attr(target, dashcase(key), value[key]) }
