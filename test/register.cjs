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

props.forEach(prop => {
  if (prop in global) return
  Object.defineProperty(global, prop, {
    configurable: true,
    get: () => window[prop]
  })
})
