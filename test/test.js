import './signal.js'
import './store.js'
import './directive.js'

// sprae.use(signals)

Object.defineProperty(DocumentFragment.prototype, "outerHTML", {
  get() {
    let s = "";
    this.childNodes.forEach((n) => {
      s += n.nodeType === 3 ? n.textContent : n.outerHTML != null ? n.outerHTML : "";
    });
    return s;
  },
});

// redefine outerHTML/innerHTML to return unmarked code
(function () {
  const originalOuterHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'outerHTML');
  const originalInnerHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');

  function unmark(el) {
    el.classList.remove(`∴`);
    if (el.className === '') el.removeAttribute('class');
    for (let subel of el.querySelectorAll(`.∴`)) {
      subel.classList.remove(`∴`);
    }
    for (let subel of el.querySelectorAll(`[class]`)) if (subel.className === '') subel.removeAttribute('class');
    return el;
  }

  Object.defineProperties(HTMLElement.prototype, {
    outerHTML: {
      get() {
        const clone = unmark(this.cloneNode(true));
        return originalOuterHTMLDescriptor.get.call(clone);
      },
      configurable: true,
      enumerable: true,
    },
    innerHTML: {
      get() {
        const clone = unmark(this.cloneNode(true));
        return originalInnerHTMLDescriptor.get.call(clone);
      },
      set: originalInnerHTMLDescriptor.set,
      configurable: true,
      enumerable: true,
    }
  });
})();
