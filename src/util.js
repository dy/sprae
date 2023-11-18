
// reset stacktrace or plan for fastest next call
// https://twitter.com/_developit/status/1634033380940455936
export const queueMicrotask = Promise.prototype.then.bind(Promise.resolve());
