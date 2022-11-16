import { directive, parseExpr } from '../core.js'

directive(':if', (el, expr) => {
  let cur = el, els = [el], clauses = [parseExpr(expr)], holder = new Text

  // collect clauses
  while (cur = el.nextElementSibling) {
    if (expr = cur.getAttribute(':else-if')) {
      cur.removeAttribute(':else-if');
      cur.classList.add('∴else-if')
      cur.remove();
      els.push(cur); clauses.push(parseExpr(expr));
      continue
    }
    if (cur.hasAttribute(':else')) {
      cur.removeAttribute(':else');
      cur.classList.add('∴else')
      cur.remove();
      els.push(cur); clauses.push(() => 1);
    }
    break;
  }

  cur = els[0]

  return state => {
    let idx = clauses.findIndex(match => match(state));
    if (idx >= 0) cur.replaceWith(cur = els[idx]);
    else cur.replaceWith(cur = holder);
  }
})