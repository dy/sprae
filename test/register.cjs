// provide DOM env for node tests
let { JSDOM } = require('jsdom')
require('requestidlecallback')

const { window } = new JSDOM(`<!DOCTYPE html>`, {
  url: "http://localhost/",
  storageQuota: 10000000,
  pretendToBeVisual: true,
  FetchExternalResources: false,
  ProcessExternalResources: false,
  // runScripts: "dangerously"
})

let props = Object.getOwnPropertyNames(window)

// Force JSDOM's HTMLElement/customElements even if Node provides its own (Node 25+)
const forceJSDOM = ['HTMLElement', 'customElements']
props.forEach(prop => {
  if (prop in global && !forceJSDOM.includes(prop)) return
  Object.defineProperty(global, prop, {
    configurable: true,
    get: () => window[prop]
  })
})
