import sube from "sube";

// reset stacktrace or plan for fastest next call
// https://twitter.com/_developit/status/1634033380940455936
export const queueMicrotask = Promise.prototype.then.bind(Promise.resolve());


export const isObject = v => v?.constructor === Object;
export const isPrimitive = (value) => value !== Object(value);

// subscribe to reactive value
export const subscribe = (value, update) => (isPrimitive(value) ? update(value) : sube(value, update), update)
