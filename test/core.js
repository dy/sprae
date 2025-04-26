import test, { is } from "tst";
import { tick, time } from "wait-please";
import sprae from '../sprae.js'
import store from '../store.js'
import { signal } from '../signal.js'
import h from "hyperf";

// FIXME: enable signals back
// import * as signals from '@preact/signals-core'
// sprae.use(signals)

test('core: pre-created store', async () => {
  let state = store({x:1,get(){return state.x}})
  let el = h`<x :text="get()"></x>`
  sprae(el, state)
  is(el.outerHTML, `<x>1</x>`)
  state.x=2
  is(el.outerHTML, `<x>2</x>`)
})

test.todo('core: sync store access', async () => {
  let el = h`<x :text="get()"></x>`
  let state = sprae(el, {x:1,get(){return state.x}})
  is(el.outerHTML, `<x>1</x>`)
  state.x=2
  is(el.outerHTML, `<x>2</x>`)
})


test("core: simple hidden attr", async () => {
  let el = h`<div :hidden="hidden"></div>`;
  let params = sprae(el, { hidden: true });
  is(el.outerHTML, `<div hidden=""></div>`);
  params.hidden = false;
  await tick();
  is(el.outerHTML, `<div></div>`);
});

test("core: hidden reactive", async () => {
  const hidden = signal(true);
  let el = h`<div :hidden="hidden"></div>`;
  sprae(el, { hidden });
  is(el.outerHTML, `<div hidden=""></div>`);
  hidden.value = false;
  await tick()
  is(el.outerHTML, `<div></div>`);
});

test("core: reactive", async () => {
  let el = h`<label :for="name" :text="name" ></label><input :id="name" :name="name" :type="name" :disabled="!name"/><a :href="url"></a><img :src="url"/>`;
  let params = sprae(el, { name: 'text', url: "//google.com" });
  is(
    el.outerHTML,
    `<label for="text">text</label><input id="text" name="text" type="text"><a href="//google.com"></a><img src="//google.com">`,
  );
  params.name = "email";
  await tick();
  is(
    el.outerHTML,
    `<label for="email">email</label><input id="email" name="email" type="email"><a href="//google.com"></a><img src="//google.com">`,
  );
});

test.skip('core: multiple elements', async () => {
  // NOTE: we don't support that anymore - no much value at price of complexity, just pass container
  let el = h`<a><x :text="'x'"></x><y :text="'y'"></y></a>`
  sprae(el.childNodes)
  is(el.innerHTML, `<x>x</x><y>y</y>`)
})

test("core: empty strings", async () => {
  let el = h`<x :="" :x=""></x>`;
  sprae(el);
  is(el.outerHTML, `<x></x>`);
});

test("core: comments", async () => {
  let el = h`<x :="/* */" :x="/* */"></x>`;
  sprae(el);
  is(el.outerHTML, `<x></x>`);
});

test("core: newlines", async () => {
  let el = h`<x :text="
  x
  "></x>`;
  sprae(el, { x: 1 });
  is(el.outerHTML, `<x>1</x>`);
});

test.skip("core: const in on", async () => {
  let el = h`<div :onx="() => {const x=1; y=x+1}"></div>`;
  let state = sprae(el, { y: 0 });
  el.dispatchEvent(new window.CustomEvent("x"));
  is(state.y, 2);
});

test.skip("core: const in scope", async () => {
  let el = h`<div :scope="{x(){let x = 1; y=x;}}" :onx="x()"></div>`;
  let state = sprae(el, { y: 0 });
  el.dispatchEvent(new window.CustomEvent("x"));
  await tick();
  is(state.y, 1);
});

test("core: bulk set", async () => {
  let el = h`<input :id="0" :="{for:1, title:2, help:3, type:4, placeholder: 5, value: 6, aB: 8}" :value="7"/>`;
  sprae(el);
  is(el.outerHTML, `<input id="0" for="1" title="2" help="3" type="4" placeholder="5" value="7" a-b="8">`);
});

test("core: sets el.prop", async () => {
  let el = h`<x :ref="e => el=e" :x="el.x=1" :y="el.y='abc'"></x>`;
  sprae(el, { el: null });
  is(el.x, 1);
  is(el.y, "abc");
});

test("core: multiprop", async () => {
  let el = h`<input :id:name:for="0" />`;
  sprae(el);
  is(el.outerHTML, `<input id="0" name="0" for="0">`);
});

test("core: calculation", async () => {
  // FIXME: fails for justin (cycle detected)
  let el = h`<x :x="a = 5, Array.from({length: x}, (_,i) => (i)).join('')"></x>`;
  let state = sprae(el, { x: 3, console, Array });
  is(el.outerHTML, `<x x="012"></x>`);
  state.x = 4;
  await tick();
  is(el.outerHTML, `<x x="0123"></x>`);
});

test.skip("core: semicols in expression", async () => {
  let el = h`<x :x="log.push(0); log.push(Array.from({length: x.value}, (_,i)=>i).join(''));"></x>`;
  let state = sprae(el, { x: signal(3), Array, log: [] });
  // is(el.outerHTML, `<x x="012"></x>`);
  is(state.log, [0, '012'])
  state.x.value = 4;
  is(state.log, [0, '012', 0, '0123'])
  // is(el.outerHTML, `<x x="0123"></x>`);
});

test("fx: effects", async () => {
  let el = h`<x :fx="(log.push(x), () => (log.push('out')))"></x>`;
  let x = signal(1)
  let state = sprae(el, { log: [], x, console });
  is(el.outerHTML, `<x></x>`);
  is(state.log, [1])
  console.log('upd value')
  x.value = 2
  await tick()
  is(el.outerHTML, `<x></x>`);
  is(state.log, [1, 'out', 2])
  el[Symbol.dispose]()
  is(state.log, [1, 'out', 2, 'out'])
});

test(":: reactive values", async () => {
  let a = signal();
  setTimeout(() => (a.value = 2), 10);

  let el = h`<x :text="a">1</x>`;
  sprae(el, { a });
  is(el.outerHTML, `<x></x>`);

  await time(20);
  is(el.outerHTML, `<x>2</x>`);
});

test(":: null result does nothing", async () => {
  let a = h`<x :="undefined"></x>`;
  sprae(a);
  is(a.outerHTML, `<x></x>`);
});

test.skip("immediate scope", async () => {
  let el = h`<x :scope="{arr:[], inc(){ arr.push(1) }}" :onx="e=>inc()" :text="arr[0]"></x>`;
  sprae(el);
  is(el.outerHTML, `<x></x>`);
  el.dispatchEvent(new window.CustomEvent("x"));
  await tick();
  is(el.outerHTML, `<x>1</x>`);
});

test("getters", async () => {
  let x = h`<h2 :text="doubledCount >= 1 ? 1 : 0"></h2>`;
  let state = sprae(x, {
    count: signal(0),
    get doubledCount() {
      return this.count * 2;
    },
  });
  is(x.outerHTML, `<h2>0</h2>`);
  state.count++;
  await tick();
  is(x.outerHTML, `<h2>1</h2>`);
});

test("subscribe to array length", async () => {
  // pre-heat can cause error
  sprae(h`<x :fx="(log.push(1))"></x>`, { log: [] });

  console.log('---create')
  let el = h`<div :scope="{likes:[]}"><x :onx="e=>(console.log('onx'),likes.push(1))"></x><y :text="console.log('text'),likes.length"></y></div>`;
  sprae(el, { console });
  is(el.innerHTML, `<x></x><y>0</y>`);

  console.log('---event')
  el.firstChild.dispatchEvent(new window.CustomEvent("x"));
  await tick();
  is(el.innerHTML, `<x></x><y>1</y>`);
});

test.skip("csp: sandbox", async () => {
  const { default: justin } = await import('subscript/justin')
  sprae.use({ compile: justin })
  const globals = { console };
  const state = Object.assign(Object.create(globals), { log: [] });

  // let el = h`<x :x="log.push(1)"></x>`
  let el = h`<x :x="console.group('set'),log.push( self,  console,  arguments,  __scope),console.groupEnd()"></x>`;
  let s = sprae(el.cloneNode(), state);
  is(s.log, [undefined, console, undefined, undefined]);
  // s.log.splice(0);
  // s.log = [];
  Object.assign(globals, { self: window });
  console.log("--------- sprae again with globals");
  s = sprae(el.cloneNode(), state);
  // console.log(s.log)
  is(s.log, [window, console, undefined, undefined]);
});

test('globals', async () => {
  let el = h`<x :text="Math.PI.toFixed(2)"></x>`
  let state = sprae(el)
  is(el.outerHTML, `<x>3.14</x>`)
})

test("switch signals", async () => {
  const preact = await import('@preact/signals-core')
  sprae.use(preact)

  let el = h`<div :text="x"/>`
  let state = sprae(el, { x: preact.signal(1) })
  is(el.innerHTML, '1')
  state.x = 2
  is(el.innerHTML, '2')
})

test("Math / other globals available in template", async () => {
  let el = h`<div :text="Math.max(2, 5, 1)"></div>`;
  sprae(el, { Math });
  is(el.innerHTML, '5');

  el = h`<div :text="Math.PI.toFixed(2)"></div>`;
  sprae(el, { Math });
  is(el.innerHTML, '3.14');

  el = h`<div :text="Math.sqrt(16)"></div>`;
  sprae(el, { Math });
  is(el.innerHTML, '4');
});

test("custom prefix", async () => {
  sprae.prefix='s-'
  let el = h`<x s-text="a"></x>`;
  sprae(el, {a:123});
  is(el.outerHTML, `<x>123</x>`);
  sprae.prefix = ':'
})

test("static errors don't break sprae", async () => {
  console.log('---again')
  let el = h`<y><x :text="0.toFixed(2)"></x><x :text="b"></x></y>`
  let state = sprae(el, {b:'b'})
  await tick()
  is(el.innerHTML, `<x></x><x>b</x>`)
})

test("runtime errors don't break sprae", async () => {
  console.log('---again')
  let el = h`<y><x :text="a.b"></x><x :text="b"></x></y>`
  let state = sprae(el, {b:'b'})
  await tick()
  is(el.innerHTML, `<x></x><x>b</x>`)
})

test.skip('memory allocation', async () => {
  let items = signal([])
  let el = h`<><x :each="item in items" :text="item.x"></x></>`
  let btn = document.createElement('button')
  document.body.appendChild(btn)
  btn.textContent = 'Allocate'
  btn.onclick = () => {
    let newItems = []
    for (let i = 0; i < 10000; i++) {
      let item = { x: i }
      newItems.push(item)
    }
    items.value = newItems
  }
  sprae(el, { items });
})

test.todo('perf: must be fast', async () => {
  let el = h`<a :l="l"><b :each="i in l"><c :text="i"/></b></a>`
  console.time('perf')
  for (let i = 0; i < 1e2; i++) {
    sprae(el.cloneNode(true), { l: 1e2 })
  }
  console.timeEnd('perf')
})

test.todo('setTimeout illegal invokation', async () => {
  let el = h`<div :with="{c:0,x(){setTimeout(() => (this.c++))}}" :onx="x" :text="c"></div>`
  sprae(el)
  is(el.innerHTML, '0')
  el.dispatchEvent(new window.CustomEvent('x'))
  await new Promise(ok => setTimeout(ok))
  is(el.innerHTML, '1')
})
