import sprae, { attr, parse, _state } from "../core.js";


// create expression setter, reflecting value back to state
export const setter = (expr, _set = parse(`${expr}=__`)) => (target, value) => {
  // save value to stash
  target.__ = value; _set(target), delete target.__
}

export default (el, state, expr, name) => {
  // bind back to value, but some values can be not bindable, eg. `:value="7"`
  try {
    const set = setter(expr)
    const handleChange = el.type === 'checkbox' ? () => set(state, el.checked) :
      el.type === 'select-multiple' ? () => set(state, [...el.selectedOptions].map(o => o.value)) :
        () => set(state, el.selectedIndex < 0 ? null : isNaN(el.valueAsNumber) ? el.value : el.valueAsNumber);

    el.oninput = el.onchange = handleChange; // hope user doesn't redefine these manually via `.oninput = somethingElse` - it saves 5 loc vs addEventListener

    if (el.type?.startsWith('select')) {
      // select element also must observe any added/removed options or changed values (outside of sprae)
      new MutationObserver(handleChange).observe(el, { childList: true, subtree: true, attributes: true });

      // select options must be initialized before calling an update
      sprae(el, state)
    }

    // initial state value - setter has already cached it, so parse is fast
    parse(expr)(state) ?? handleChange()
  } catch { }

  return (el.type === "text" || el.type === "" || el.tagName === "TEXTAREA") ?
    (value, _from, _to) => (
      // we retain selection in input
      (_from = el.selectionStart),
      (_to = el.selectionEnd),
      el.setAttribute("value", (el.value = value == null ? "" : value)),
      _from && el.setSelectionRange(_from, _to)
    ) :
    (el.type === "checkbox") ?
      (value) => (el.checked = value, attr(el, "checked", value)) :
      (el.type === 'radio') ? (value) => (
        el.value === value && ((el.checked = value), attr(el, 'checked', value))
      ) :
        (el.type === "select-one") ?
          (value) => {
            for (let o of el.options)
              o.value == value ? o.setAttribute("selected", '') : o.removeAttribute("selected");
            el.value = value;
          } :
          (el.type === 'select-multiple') ? (value) => {
            for (let o of el.options) o.removeAttribute('selected')
            for (let v of value) el.querySelector(`[value="${v}"]`).setAttribute('selected', '')
          } :
            (value) => (el.value = value);
}
