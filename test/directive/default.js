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
