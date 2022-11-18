import { directive } from '../core.js'

directive(':on', (el) => {
  let listeners
  return (values) => {
    for (let evt in listeners) el.removeEventListener(evt, listeners[evt]);
    listeners = values;
    for (let evt in listeners) el.addEventListener(evt, listeners[evt]);
  }
})

