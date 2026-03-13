import { tick, time } from "wait-please";
import sprae from '../../sprae.js'
import h from "hyperf";
import test, { any, is, ok } from "tst";
import { store } from '../../store.js'
import { use, signal, batch, untracked } from '../../core.js'


test("default: basic", async () => {
  let el = h`<label :for="name" :text="name" ></label><input type='text' :type="t => (log.push(t),name)" :id="name" :name="name" :disabled="!name"/><a :href="url"></a><img :src="url"/>`;
  let params = sprae(el, { name: 'text', url: "//google.com", log:[] });
  is(
    el.outerHTML,
    `<label for="text">text</label><input type="text" id="text" name="text"><a href="//google.com"></a><img src="//google.com">`,
  );
  is(params.log, ['text'])
  params.name = "email";
  await tick();
  is(
    el.outerHTML,
    `<label for="email">email</label><input type="email" id="email" name="email"><a href="//google.com"></a><img src="//google.com">`,
  );
});

test("default: signal", async () => {
  let a = signal();
  setTimeout(() => (a.value = 2), 10);

  let el = h`<x :text="a">1</x>`;
  sprae(el, { a });
  is(el.outerHTML, `<x></x>`);

  await time(20);
  is(el.outerHTML, `<x>2</x>`);
});

test("default: .parent target", async () => {
  let el = h`<div><x :title.parent="t"></x></div>`;
  let params = sprae(el, { t: 'hello' });
  is(el.getAttribute('title'), 'hello');
  is(el.firstChild.getAttribute('title'), null);
});

test("default: null result does nothing", async () => {
  let a = h`<x :="undefined"></x>`;
  sprae(a);
  is(a.outerHTML, `<x></x>`);
});

// web components: props should be set as element properties, not serialized to attributes
test("default: web component prop (object)", async () => {
  class XItems extends HTMLElement { constructor() { super() } }
  customElements.define('x-items', XItems);

  let items = [1, 2, 3];
  let el = h`<x-items :items="items"></x-items>`;
  sprae(el, { items });

  // object/array values should be set as properties on custom elements
  is(el.items, items);
  // should not serialize to attribute
  is(el.getAttribute('items'), null);
});

test("default: web component prop (primitive)", async () => {
  class XLabel extends HTMLElement { constructor() { super() } }
  customElements.define('x-label', XLabel);

  let el = h`<x-label :title="t"></x-label>`;
  sprae(el, { t: 'hello' });

  // primitive values still go to attributes
  is(el.getAttribute('title'), 'hello');
});

test("default: web component prop (reactive update)", async () => {
  class XData extends HTMLElement { constructor() { super() } }
  customElements.define('x-data', XData);

  let el = h`<x-data :config="cfg"></x-data>`;
  let state = sprae(el, { cfg: { a: 1 } });
  is(el.config, { a: 1 });

  state.cfg = { a: 2 };
  await tick();
  is(el.config, { a: 2 });
});

test("default: spread on web component", async () => {
  class XSpread extends HTMLElement { constructor() { super() } }
  customElements.define('x-spread', XSpread);

  let el = h`<x-spread :="{ items, label }" ></x-spread>`;
  let items = [1, 2, 3];
  sprae(el, { items, label: 'test' });

  // object prop set as property
  is(el.items, items);
  // primitive prop set as attribute
  is(el.getAttribute('label'), 'test');
});
