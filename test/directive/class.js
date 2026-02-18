import { tick, time } from "wait-please";
import sprae from '../../sprae.js'
import h from "hyperf";
import test, { any, is, ok } from "tst";
import { store } from '../../store.js'
import { use, signal, batch, untracked } from '../../core.js'


test('class: basic', async () => {
  let el = h`<x class="base" :class="a"></x><y :class="[b, c]"></y><z :class="{c:d}"></z>`;
  const c = signal("z");
  let params = sprae(el, { a: "x", b: "y", c, d: false });
  is(el.outerHTML, `<x class="base x"></x><y class="y z"></y><z></z>`);
  params.d = true;
  await tick();
  is(el.outerHTML, `<x class="base x"></x><y class="y z"></y><z class="c"></z>`);
  c.value = 'w'
  await tick()
  is(el.outerHTML, `<x class="base x"></x><y class="y w"></y><z class="c"></z>`);
});

test('class: maintains manually changed classes', async () => {
  let el = h`<x class="a" :class="['b',c]"></x>`
  let c = signal('c')
  sprae(el, { c })
  is(el.outerHTML, `<x class="a b c"></x>`)
  el.classList.add('d')
  is(el.outerHTML, `<x class="a b c d"></x>`)
  c.value = 'c1'
  await tick()
  is(el.outerHTML, `<x class="a b d c1"></x>`)
})

test('class: undefined value', async () => {
  let el = h`<x :class="a"></x><y :class="[b]"></y><z :class="{c}"></z>`;
  sprae(el, { a: undefined, b: undefined, c: undefined });
  is(el.outerHTML, `<x></x><y></y><z></z>`);
});

test('class: old svg fun', async () => {
  // raw html creates SVGAnimatedString
  let el = document.createElement("div");
  el.innerHTML = `<svg class="foo" :class="a ? 'x' : 'y'"></svg>`;

  let s = sprae(el, { a: true });
  is(el.innerHTML, `<svg class="foo x"></svg>`);
  s.a = false;
  await tick();
  is(el.innerHTML, `<svg class="foo y"></svg>`);
});

test('class: function', async () => {
  let el = document.createElement("div");
  el.innerHTML = `<div class="foo" :class="cn => (log.push(cn), [cn, a])"></div>`;

  let s = sprae(el, { a: 'a', log: [] });
  is(el.innerHTML, `<div class="foo a"></div>`);
  is(s.log, ['foo'])

  console.log('----- s.a="b" ')
  s.a = 'b';
  await tick();
  is(el.innerHTML, `<div class="foo a b"></div>`);
  is(s.log, ['foo', 'foo a'])
});

test("class: .parent target", async () => {
  let el = h`<div><x :class.parent="cls"></x></div>`;
  let params = sprae(el, { cls: 'active' });
  is(el.classList.contains('active'), true);
  is(el.firstChild.classList.contains('active'), false);
});

test.skip("class: interpolation", async () => {
  let el = h`<x :class="'a $<b> c-$<c>'"></x>`;
  sprae(el, { a: 'a', b: 'b', c: 0 });
  is(el.outerHTML, `<x class="a b c-0"></x>`);
});

test('class: each + class with signal array', async () => {
  let el = document.createElement('div')
  el.innerHTML = `<button :each="opt in options" :class="{ selected: value.includes(opt) }" :text="opt"></button>`
  document.body.appendChild(el)

  const value = signal(['a'])
  sprae(el, { options: ['a', 'b', 'c'], value })

  await tick()
  is(el.children[0].classList.contains('selected'), true, 'init: a selected')
  is(el.children[1].classList.contains('selected'), false, 'init: b not selected')
  is(el.children[2].classList.contains('selected'), false, 'init: c not selected')

  value.value = ['a', 'b']
  await tick()
  is(el.children[0].classList.contains('selected'), true, 'step2: a selected')
  is(el.children[1].classList.contains('selected'), true, 'step2: b selected')
  is(el.children[2].classList.contains('selected'), false, 'step2: c not selected')

  value.value = ['b']
  await tick()
  is(el.children[0].classList.contains('selected'), false, 'step3: a not selected')
  is(el.children[1].classList.contains('selected'), true, 'step3: b selected')
  is(el.children[2].classList.contains('selected'), false, 'step3: c not selected')

  document.body.removeChild(el)
});
