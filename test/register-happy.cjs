// provide DOM env for benchmarks (happy-dom for speed)
const { Window } = require('happy-dom')
require('requestidlecallback')

const window = new Window({
  url: "http://localhost/",
})

let props = Object.getOwnPropertyNames(window)
  .filter(p => !p.startsWith('_'))
  .filter(p => typeof globalThis[p] === 'undefined')
props.map(p => globalThis[p] = window[p])
globalThis.window = globalThis;

// Retain DOM element instances
Object.assign(globalThis, {
  document: window.document,
  MutationObserver: window.MutationObserver,
  ShadowRoot: window.ShadowRoot,
  Element: window.Element,
  Text: window.Text,
  HTMLElement: window.HTMLElement,
  CSSStyleDeclaration: window.CSSStyleDeclaration,
  CustomEvent: window.CustomEvent,
  ResizeObserver: window.ResizeObserver,
  DocumentFragment: window.DocumentFragment,
  XMLSerializer: window.XMLSerializer,
  SVGElement: window.SVGElement,
})
