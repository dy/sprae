import test, { is, ok } from "tst";
import { tick, time } from "wait-please";
import sprae, { start } from '../sprae.js'
import store from '../store.js'
import { signal, use } from '../core.js'
import h from "hyperf";

test('core: version', () => {
  ok(sprae.version, '12.1.0')
})

test('core: pre-created store', async () => {
  let state = store({x:1,get(){return state.x}})
  let el = h`<x :text="get()"></x>`
  sprae(el, state)
  is(el.outerHTML, `<x>1</x>`)
  state.x=2
  await tick()
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

test.skip("core: comments", async () => {
  // NOTE: we don't support that anymore - no questionable value
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

test("core: const", async () => {
  let el = h`<div :onx="const x=1; y=x+1"></div>`;
  let state = sprae(el, { y: 0 });
  el.dispatchEvent(new window.CustomEvent("x"));
  is(state.y, 2);
});

test("core: let", async () => {
  let el = h`<div :fx="let x=1; y=x+1"></div>`;
  let state = sprae(el, { y: 0 });
  is(state.y, 2);
});

test("core: if", async () => {
  let el = h`<div :fx="if (x) log.push(1)"></div>`;
  let state = sprae(el, { x: 0, log: [] });
  is( state.log, []);
  state.x = 1;
  await tick();
  is(state.log, [1]);
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
  await tick()
  is(state.log, [0, '012'])
  state.x.value = 4;
  await tick()
  is(state.log, [0, '012', 0, '0123'])
  // is(el.outerHTML, `<x x="0123"></x>`);
});

test("core: async value", async () => {
  let fetchData = async () => { await time(50); return 'data'; };
  let el = h`<div :fx="( x='', async () => ( x = await fetchData() ) )()" :text="x"></div>`;
  let state = sprae(el, { fetchData });
  is(el.textContent, '');
  await time(60);
  is(window.x, undefined);
  is(el.textContent, 'data');
});

test("core: async prop", async () => {
  let fetchData = async () => { await time(50); return 'data'; };
  let el = h`<div :text="await fetchData()"></div>`;
  let state = sprae(el, { fetchData  });
  is(el.textContent, '');
  await time(60);
  is(el.textContent, 'data');
});

test.skip("core: immediate scope", async () => {
  let el = h`<x :scope="{arr:[], inc(){ arr.push(1) }}" :onx="e=>inc()" :text="arr[0]"></x>`;
  sprae(el);
  is(el.outerHTML, `<x></x>`);
  el.dispatchEvent(new window.CustomEvent("x"));
  await tick();
  is(el.outerHTML, `<x>1</x>`);
});

test("core: getters", async () => {
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

test("core: subscribe to array length", async () => {
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

test.skip("core: switch signals", async () => {
  const preact = await import('@preact/signals-core')
  use(preact)

  let el = h`<div :text="x"/>`
  let state = sprae(el, { x: preact.signal(1) })
  is(el.innerHTML, '1')
  state.x = 2
  await tick()
  is(el.innerHTML, '2')

  use(signals)
})

test("core: Math / other globals available in template", async () => {
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

test("core: custom prefix", async () => {
  use({ prefix: 's-' })
  let el = h`<x s-text="a"></x>`;
  sprae(el, {a:123});
  is(el.outerHTML, `<x>123</x>`);
  use({prefix:':'})
})

test("core: static errors don't break sprae", async () => {
  console.log('---again')
  let el = h`<y><x :text="0.toFixed(2)"></x><x :text="b"></x></y>`
  let state = sprae(el, {b:'b'})
  await tick()
  is(el.innerHTML, `<x></x><x>b</x>`)
})

test("core: runtime errors don't break sprae", async () => {
  console.log('---again')
  let el = h`<y><x :text="a.b"></x><x :text="b"></x></y>`
  let state = sprae(el, {b:'b'})
  await tick()
  is(el.innerHTML, `<x></x><x>b</x>`)
})

test.skip('core: memory allocation', async () => {
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

test('core: setTimeout illegal invokation', async () => {
  let el = h`<div :scope="c=0, x = ()=>{ window.setTimeout(() => (c++)) }" :onx="x" :text="c"></div>`
  sprae(el)
  is(el.innerHTML, '0')
  el.dispatchEvent(new window.CustomEvent('x'))
  await time(0)
  is(el.innerHTML, '2')
})

test('core: autostart', async () => {
  let container = h`<div id="root" :scope="{pre:'pre', post:'post'}"><x :text="pre"></x></div>`;
  start(container);
  is(container.innerHTML, `<x>pre</x>`);
  let el = h`<y :text="post"></y>`
  container.appendChild(el);
  await time(10);
  is(container.innerHTML, `<x>pre</x><y>post</y>`);
})

test('core: autostart nested case', async () => {
  let container = h`<div :scope="{}"></div>`;
  start(container);
  await time()
  let a = h`<div><div :each="item in [{id:1}, {id:2}]"><x :text="item.id"></x></div></div>`
  container.appendChild(a)
  await time(10);
  is(container.innerHTML, `<div><div><x>1</x></div><div><x>2</x></div></div>`);
})

test('core: autostart nested case 2', async () => {
  let container = h`<div></div>`;
  let state = start(container, {log:[]});
  await time()
  let a = h`<y :each='item in [{ id: "1" },{ id: "2" }]'></y>`
  let x = h`<x :text="log.push(item?.id)">dir</x>`
  container.appendChild(a)
  // NOTE: mutation observer here creates extra record, which inserts "template" element child, which is supposed to be ignored
  a.appendChild(x)
  await time(10);
  is(container.innerHTML, `<y><x>1</x></y><y><x>2</x></y>`);
  is(state.log, ['1','2'])
})

test('core: list length unsub (preact signals)', async () => {
  // list.push disables list.length reading as reactive (cycle prevention)
  // but then preact signals unsubscribe :text from list.length updates
  let a = h`<x :scope="{list:[], add(item){ this.list.push('item') }}" ><y :text="list.length"></y><button :onx="add"></button></x>`
  let s = sprae(a)
  is(a.innerHTML, `<y>0</y><button></button>`)
  await time()

  console.log('---dispatch x')
  a.querySelector('button').dispatchEvent(new window.Event('x'))
  await time()
  is(a.innerHTML, `<y>1</y><button></button>`)

  console.log('---dispatch x')
  a.querySelector('button').dispatchEvent(new window.Event('x'))
  await time()
  is(a.innerHTML, `<y>2</y><button></button>`)
})
