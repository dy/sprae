// Upstream isKeyed instrumentation (krausest/js-framework-benchmark webdriver-ts)
export default `
window.nonKeyedDetector_reset = function() {
  window.nonKeyedDetector_tradded = [];
  window.nonKeyedDetector_trremoved = [];
  window.nonKeyedDetector_removedStoredTr = [];
}
function countDiff(a, b) {
  let s = new Set(a);
  for (let o of b) s.delete(o);
  return s.size;
}
function filterTR(nodes) {
  let trs = [];
  nodes.forEach(n => {
    if (n.tagName === 'TR') trs.push(n);
    if (n.childNodes?.length) trs = trs.concat(filterTR(n.childNodes));
  });
  return trs;
}
window.nonKeyedDetector_instrument = function() {
  let target = document.querySelector('table.table');
  new MutationObserver(mutations => {
    for (let m of mutations) {
      if (m.type !== 'childList') continue;
      nonKeyedDetector_tradded = nonKeyedDetector_tradded.concat(filterTR(m.addedNodes));
      nonKeyedDetector_trremoved = nonKeyedDetector_trremoved.concat(filterTR(m.removedNodes));
    }
  }).observe(target, { childList: true, subtree: true });
}
window.nonKeyedDetector_result = function() {
  return {
    tradded: nonKeyedDetector_tradded.length,
    trremoved: nonKeyedDetector_trremoved.length,
    removedStoredTr: nonKeyedDetector_trremoved.indexOf(window.storedTr) > -1,
    newNodes: countDiff(nonKeyedDetector_tradded, nonKeyedDetector_trremoved)
  };
}
window.nonKeyedDetector_storeTr = function() {
  let i = document.querySelector('tr:nth-child(1)') ? 2 : 3;
  window.storedTr = document.querySelector('tr:nth-child(' + i + ')');
}
nonKeyedDetector_reset();
`
