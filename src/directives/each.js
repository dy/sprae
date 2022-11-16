import sprae, { directive, exprError, parseExpr } from '../core.js'

directive(':each', (el, expr) => {
  let each = parseForExpression(expr);
  if (!each) return exprError(new Error, expr, el);

  const getItems = parseExpr(each.items);

  const holder = new Text
  el.replaceWith(holder)

  // FIXME: make sure no memory leak here
  // FIXME: there can DOM swapper be used instead
  let els = [];
  return state => {
    els.forEach(el => el.remove()); els = [];
    let items = getItems(state);
    if (typeof items === 'number') items = Array.from({length: items}, (item, i)=>i+1)
    items?.forEach((item,i) => {
      const scope = {...state};
      scope[each.item] = item;
      if (each.index) scope[each.index] = i;
      let itemEl = el.cloneNode(true);
      els.push(itemEl);
      holder.before(itemEl);
      sprae(itemEl, scope);
    });
  }
})

// This was taken AlpineJS, former VueJS 2.* core. Thanks Alpine & Vue!
function parseForExpression(expression) {
  let forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/
  let stripParensRE = /^\s*\(|\)\s*$/g
  let forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
  let inMatch = expression.match(forAliasRE)

  if (!inMatch) return

  let res = {}
  res.items = inMatch[2].trim()
  let item = inMatch[1].replace(stripParensRE, '').trim()
  let iteratorMatch = item.match(forIteratorRE)

  if (iteratorMatch) {
      res.item = item.replace(forIteratorRE, '').trim()
      res.index = iteratorMatch[1].trim()
  } else {
      res.item = item
  }

  return res
}
