// :="{a,b,c}"

export default (target, state, expr, parts) => value => { for (let key in value) attr(target, dashcase(key), value[key]) }

// camel to kebab
export const dashcase = (str) => {
  return str.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, (match, i) => (i ? '-' : '') + match.toLowerCase());
}

// set attr
export const attr = (el, name, v) => {
  if (v == null || v === false) el.removeAttribute(name);
  else el.setAttribute(name, v === true ? "" : typeof v === "number" || typeof v === "string" ? v : "");
}
