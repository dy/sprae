import test, { is } from "tst";
import { tick } from "wait-please";
import sprae from '../sprae.js'
import { signal, batch, untracked } from '../signal.js'
import store from '../store.js'
import h from "hyperf";


test.skip('each: top-level list', async () => {
  let el = h`<x :each="item in items" :text="item.x"/>`
  sprae(el, { items: [{ x: 1 }] })
  is(el.outerHTML, `<x>1</x>`)
})

test('each: number', async () => {
  let el = h`<div><x :each="i, i0 in 3" :text="[i, i0]"/></div>`
  sprae(el)
  is(el.innerHTML, `<x>1,0</x><x>2,1</x><x>3,2</x>`)
})

test("each: array full", async () => {
  let el = h`<p>
    <span :each="a in b" :text="a"></span>
  </p>`;

  const params = sprae(el, { b: [0] });

  is(el.innerHTML, "<span>0</span>");

  console.log("--items[0]=1");
  params.b[0] = 1;
  await tick()
  is(el.innerHTML, "<span>1</span>");

  console.log("--items[1]=3");
  params.b[1] = 3;
  await tick();
  is(el.innerHTML, `<span>1</span><span>3</span>`);

  console.log("--items=[2,3]");
  params.b = [2, 3];
  await tick();
  is(el.innerHTML, "<span>2</span><span>3</span>");

  console.log("--items[0]=1");
  params.b[0] = 1;
  await tick()
  is(el.innerHTML, "<span>1</span><span>3</span>");

  console.log("--items.shift()");
  params.b.shift();
  await tick();
  is(el.innerHTML, "<span>3</span>");

  console.log("--items.length=2");
  params.b.length = 2;
  await tick();
  is(el.innerHTML, "<span>3</span><span></span>");

  console.log("--items.pop()");
  params.b.pop();
  await tick();
  is(el.innerHTML, "<span>3</span>");

  console.log("--items=[]");
  params.b = [];
  await tick();
  is(el.innerHTML, "");

  console.log("--items=null");
  params.b = null;
  await tick();
  is(el.innerHTML, "");
});

test('each: array internal signal reassign', async () => {
  let el = h`<p><span :each="a in b" :text="a"></span></p>`;

  let s
  const params = sprae(el, { b: signal([s = signal(0)]) });

  is(el.innerHTML, "<span>0</span>", 'signal([signal(0)])');

  console.log('---b[0].value = 1')
  params.b[0].value = 1;
  await tick()
  is(el.innerHTML, "<span>1</span>", 'b[0] = 1');

  console.log('---b=[signal(2)]')
  // params.b.value[0] = signal(2);
  // params.b.value = [...params.b.value]
  params.b = [signal(2)];
  await tick();
  is(el.innerHTML, "<span>2</span>", 'b.value = [signal(2)]');

  console.log("------b.value[0].value=3");
  params.b[0].value = 3;
  await tick()
  is(el.innerHTML, "<span>3</span>", 'b.value[0].value = 3');

})

test("each: array length ops", async () => {
  let el = h`<p><span :each="a in b" :text="a"></span></p>`;
  console.log('---b=[0]')
  const params = sprae(el, { b: [0] });

  await tick()
  is(el.innerHTML, "<span>0</span>");

  console.log('---b.length = 2')
  params.b.length = 2;
  await tick()
  is(el.innerHTML, "<span>0</span><span></span>");

  console.log('---b.pop()')
  params.b.pop();
  await tick()
  is(el.innerHTML, "<span>0</span>");

  console.log('---b.shift()')
  params.b.shift();
  await tick()
  is(el.innerHTML, "");

  console.log('---b.push(1,2)')
  params.b.push(1, 2);
  await tick()
  is(el.innerHTML, "<span>1</span><span>2</span>");

  console.log('---b.pop()')
  params.b.pop();
  await tick()
  is(el.innerHTML, "<span>1</span>");
});

test("each: object", async () => {
  let el = h`<p>
    <span :each="x,key in b" :text="[key,x]"></span>
  </p>`;

  const params = sprae(el, { b: null });

  is(el.innerHTML, "");
  console.log("---set 1,2");
  params.b = { x: 1, y: 2 };
  await tick();
  is(el.innerHTML, "<span>x,1</span><span>y,2</span>");
  console.log("---b = {}");
  params.b = {};
  await tick();
  is(el.innerHTML, "");
  params.b = null;
  await tick();
  is(el.innerHTML, "");
});

test("each: #12 - changing internal object prop", async () => {
  let el = h`<div>
    <x :each="o in obj" :text="o"></x>
  </div>`;
  const state = sprae(el, { obj: { a: "a", b: "b" } });
  // console.log(el.outerHTML)
  is(el.outerHTML, `<div><x>a</x><x>b</x></div>`);
  console.log("-----set a");
  state.obj.a = "newvala"; // :each not working after this
  await tick()
  is(el.outerHTML, `<div><x>newvala</x><x>b</x></div>`);
  console.log("-----set c");
  state.obj.c = "c";
  await tick()
  is(el.outerHTML, `<div><x>newvala</x><x>b</x><x>c</x></div>`);
});

test("each: #12a - changing internal array prop", async () => {
  let el = h`<div>
    <x :each="o in arr" :text="o"></x>
  </div>`;
  const state = sprae(el, { arr: ["a", "b"] });
  // console.log(el.outerHTML)
  is(el.outerHTML, `<div><x>a</x><x>b</x></div>`);
  console.log("-----set a");
  state.arr[0] = "newvala"; // :each not working after this
  await tick()
  is(el.outerHTML, `<div><x>newvala</x><x>b</x></div>`);
  state.arr[1] = "c"; // :each not working after this
  await tick()
  is(el.outerHTML, `<div><x>newvala</x><x>c</x></div>`);
});

test("each: loop within loop", async () => {
  let el = h`<p>
    <x :each="b in c"><y :each="a in b" :text="a"></y></x>
  </p>`;

  const params = sprae(el, {
    c: [
      [1, 2],
      [3, 4],
    ],
  });

  is(el.innerHTML, "<x><y>1</y><y>2</y></x><x><y>3</y><y>4</y></x>");
  params.c = [
    [5, 6],
    [3, 4],
  ];
  await tick();
  is(el.innerHTML, "<x><y>5</y><y>6</y></x><x><y>3</y><y>4</y></x>");
  // params.c[1] = [7, 8];
  params.c = [params.c[0], [7, 8]];
  await tick();
  is(el.innerHTML, "<x><y>5</y><y>6</y></x><x><y>7</y><y>8</y></x>");
  // is(el.innerHTML, '<span>1</span><span>2</span>')
  params.c = [];
  await tick();
  is(el.innerHTML, "");
  // params.b = null
  // is(el.innerHTML, '')
});

test("each: fragments single", async () => {
  await tick()
  let el = h`<p>
    <template :each="a in b"><span :text="a"/></template>
  </p>`;

  const params = sprae(el, { b: [1] });

  is(el.innerHTML, "<span>1</span>");
  await tick()
  params.b = [1, 2];
  await tick()
  is(el.innerHTML, "<span>1</span><span>2</span>");
  console.log("params.b=[]");
  params.b = [];
  await tick()
  is(el.innerHTML, "");
  params.b = null;
  is(el.innerHTML, "");
});

test("each: fragments multiple", async () => {
  let el = h`<p>
    <template :each="v, i in b"><x :text="i"/><x :text="v"/></template>
  </p>`;

  const b = signal([1]);
  const params = sprae(el, { b });

  is(el.innerHTML, "<x>0</x><x>1</x>");
  b.value = [1, 2];
  await tick()
  is(el.innerHTML, "<x>0</x><x>1</x><x>1</x><x>2</x>");
  console.log("b.value=[]");
  b.value = [];
  await tick()
  is(el.innerHTML, "");
  params.b = null;
  is(el.innerHTML, "");
});

test("each: fragments direct", async () => {
  let el = h`<p>
    <template :each="a in b" :text="a"></template>
  </p>`;

  const b = signal([1]);
  const params = sprae(el, { b });

  is(el.innerHTML, "1");

  console.log("b.value=[1,2]");
  b.value = [1, 2];
  is(el.innerHTML, "12");

  console.log("b.value=[]");
  b.value = [];
  is(el.innerHTML, "");
  params.b = null;
  is(el.innerHTML, "");
});

test('each: fragment with condition', async () => {
  let el = h`<p>
    <template :each="a in b" :if="a!=1" :text="a"></template>
  </p>`;

  const b = signal([1, 2]);
  const params = sprae(el, { b });

  is(el.innerHTML, "2");
  b.value = [1];
  is(el.innerHTML, "");
  console.log("b.value=[]");
  b.value = [];
  is(el.innerHTML, "");
  params.b = null;
  is(el.innerHTML, "");
});

test("each: loop with condition", async () => {
  let el = h`<p>
  <span :each="a in b" :if="a!=1" :text="a"></span>
  </p>`;

  const params = sprae(el, { b: [0, 1, 2] });

  is(el.innerHTML, "<span>0</span><span>2</span>");
  params.b = [2, 0, 1];
  await tick();
  is(el.innerHTML, "<span>2</span><span>0</span>");
  params.b = null;
  await tick();
  is(el.innerHTML, "");
});

test("each: condition with loop", async () => {
  let el = h`<p>
  <span :if="c" :each="a in b" :text="a"></span>
  <span :else :text="c"></span>
  </p>`;

  const params = sprae(el, { b: [1, 2], c: false });

  is(el.innerHTML, "<span>false</span>");
  params.c = true;
  await tick();
  is(el.innerHTML, "<span>1</span><span>2</span>");
  params.b = [1];
  await tick();
  is(el.innerHTML, "<span>1</span>");
  params.b = null;
  await tick();
  is(el.innerHTML, "");
  console.log("c=false");
  params.c = false;
  await tick();
  is(el.innerHTML, "<span>false</span>");
});

test("each: loop within condition", async () => {
  let el = h`<p>
    <x :if="a==1"><y :each="i in a" :text="i"></y></x>
    <x :else :if="a==2"><y :each="i in a" :text="-i"></y></x>
  </p>`;

  const params = sprae(el, { a: signal(1) });

  is(el.innerHTML, "<x><y>1</y></x>");
  params.a = 2;
  await tick();
  is(el.innerHTML, "<x><y>-1</y><y>-2</y></x>");
  params.a = 0;
  await tick();
  is(el.innerHTML, "");
});

test("each: condition within loop", async () => {
  let el = h`<p>
    <x :each="a in b">
      <if :if="a==1" :text="'1:'+a"></if>
      <elif :else :if="a==2" :text="'2:'+a"></elif>
      <else :else :text="a"></else>
    </x>
  </p>`;

  const params = sprae(el, { b: [1, 2, 3] });

  is(el.innerHTML, "<x><if>1:1</if></x><x><elif>2:2</elif></x><x><else>3</else></x>");
  params.b = [2];
  await tick();
  is(el.innerHTML, "<x><elif>2:2</elif></x>");
  params.b = null;
  await tick();
  is(el.innerHTML, "");
});

test('each: items refer to current el', async () => {
  // NOTE: the problem here is that the next items can subscribe to `el` defined in root state (if each hasn't created scope), that will cause unnecessary :x effect
  let el = h`<div><x :each="x in 3" :data-x="x" :with="{el:null}" :ref="e=>el=e" :x="log.push(x, el.dataset.x)"></x></div>`;
  let log = signal([]);
  let state = sprae(el, { log, untracked });
  is([...state.log], [1, "1", 2, "2", 3, "3"]);
});

test("each: unkeyed", async () => {
  let el = h`<div><x :each="x, i in xs" :text="x"></x></div>`;
  let state = sprae(el, { xs: signal([1, 2, 3]) });
  is(el.children.length, 3);
  is(el.textContent, "123");
  // let first = el.firstChild
  state.xs = [1, 3, 2];
  await tick();
  // is(el.firstChild, first)
  is(el.textContent, "132");
  console.log('-------- set 333')
  state.xs = [3, 3, 3];
  await tick();
  is(el.textContent, "333");
  // is(el.firstChild, first)
});

test("each: expression as source", async () => {
  let el = h`<div><x :each="i in (x || 2)" :text="i"></x></div>`;
  sprae(el, { x: 0 });
  is(el.innerHTML, `<x>1</x><x>2</x>`);
});

test.skip("each: unmounted elements remove listeners", async () => {
  // let's hope they get removed without memory leaks...
});

test("each: internal children get updated by state update, also: update by running again", async () => {
  let el = h`<><x :each="item, idx in items" :text="item" :key="idx"></x></>`;
  let state = sprae(el, { items: signal([1, 2, 3]) });
  is(el.textContent, "123");
  console.log('----items=[2,2,3]')
  state.items = [2, 2, 3];
  await tick();
  is(el.textContent, "223");
  console.log("items = [0, 2, 3]");
  state.items = [0, 2, 3];
  // state = sprae(el, { items: [0, 2, 3] });
  await tick();
  is(el.textContent, "023");
  // NOTE: this doesn't update items, since they're new array
  console.log("-----state.items[0] = 1");
  state.items[0] = 1;
  state.items = [...state.items];
  await tick();
  is(el.textContent, "123");
});

test("each: :id and others must receive value from context", () => {
  let el = h`<div><x :each="item, idx in items" :id="idx"></x></div>`;
  sprae(el, { items: [1, 2, 3] });
  is(el.innerHTML, `<x id="0"></x><x id="1"></x><x id="2"></x>`);
});

test("each: remove last", async () => {
  let el = h`<table>
    <tr :each="item in rows" :text="item.id" />
  </table>
  `;

  const rows = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];

  let s = sprae(el, {
    rows,
    remove(item) {
      const index = this.rows.findIndex((x) => x.id == item.id);
      this.rows.splice(index, 1);
    },
  });

  is(el.outerHTML, `<table><tr>1</tr><tr>2</tr><tr>3</tr><tr>4</tr><tr>5</tr></table>`);
  console.log("---Remove id 5");
  s.remove({ id: 5 });
  await tick()
  is(el.outerHTML, `<table><tr>1</tr><tr>2</tr><tr>3</tr><tr>4</tr></table>`);
});

test("each: remove first", async () => {
  let el = h`<table>
    <tr :each="item in rows" :text="item.id" />
  </table>
  `;

  const rows = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];

  let s = sprae(el, {
    rows,
    remove(item) {
      const index = this.rows.findIndex((x) => x.id == item.id);
      this.rows.splice(index, 1);
    },
  });

  is(el.outerHTML, `<table><tr>1</tr><tr>2</tr><tr>3</tr><tr>4</tr><tr>5</tr></table>`);
  console.log("Remove id 1");
  s.remove({ id: 1 });
  await tick()
  is(el.outerHTML, `<table><tr>2</tr><tr>3</tr><tr>4</tr><tr>5</tr></table>`);
});

test("each: swapping", async () => {
  let el = h`<table>
    <tr :each="item in rows" :text="item.id" />
  </table>`;

  const rows = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];

  let s = sprae(el, {
    rows,
    swap() {
      const a = this.rows[1];
      console.log(`[1]=[4]`);
      this.rows[1] = this.rows[this.rows.length - 2];
      console.log(`[4]=[1]`);
      this.rows[this.rows.length - 2] = a;
    },
  });

  is(el.outerHTML, `<table><tr>1</tr><tr>2</tr><tr>3</tr><tr>4</tr><tr>5</tr></table>`);
  s.swap();
  await tick();
  is(el.outerHTML, `<table><tr>1</tr><tr>4</tr><tr>3</tr><tr>2</tr><tr>5</tr></table>`);
});

test("each: with :with", () => {
  let el = h`<ul><li :each="i in 3" :with="{x:i}" :text="x"></li></ul>`;
  sprae(el);
  is(el.outerHTML, `<ul><li>1</li><li>2</li><li>3</li></ul>`);
});

test("each: subscribe to modifying list", async () => {
  let el = h`<ul>
    <li :each="item in rows" :text="item" :onremove="e=>remove(item)">
    </li>
  </ul>`;
  const state = sprae(el, {
    rows: [1],
    remove() {
      this.rows = [];
    },
  });
  is(el.outerHTML, `<ul><li>1</li></ul>`);
  // state.remove()
  el.querySelector("li").dispatchEvent(new window.Event("remove"));
  console.log("---removed", state.rows);

  await tick();
  is(el.outerHTML, `<ul></ul>`);
});

test('each: unwanted extra subscription', async () => {
  let el = h`<div><x :each="item,i in (console.log('upd',_count),_count++, rows)"><a :text="item.label"></a></x></div>`

  const rows = signal(null)
  const state = sprae(el, { rows, _count: 0, console })

  console.log('------rows.value = [{id:0},{id:1}]')
  await tick()
  is(state._count, 1)

  let a = { label: signal(0) }, b = { label: signal(0) }
  rows.value = [a, b]
  await tick()
  is(state._count, 2)

  console.log('--------rows.value[1].label.value += 2')
  b.label.value += 2
  is(state._count, 2)
  is(el.innerHTML, `<x><a>0</a></x><x><a>2</a></x>`)

  console.log('---------rows.value=[rows.value[0]]')
  // this thingy subscribes full list to update
  rows.value = [b]
  await tick()
  is(state._count, 3)
  is(el.innerHTML, `<x><a>2</a></x>`)

  console.log('--------rows.value[0].label += 2')
  b.label.value += 2
  await tick()
  is(state._count, 3)
  is(el.innerHTML, `<x><a>4</a></x>`)
});

test('each: batched .length updates', async () => {
  let c = 0
  let state = store({ list: [1, 2], count() { c++ } })
  let el = h`<a><b :each="x in (count(), list)" :text="x"/></a>`
  sprae(el, state)
  await tick()
  is(c, 1)
  is(el.innerHTML, `<b>1</b><b>2</b>`)

  state.list.push(3, 4, 5)
  // bump list
  batch(() => {
    let list = state.list
    state.list = null
    state.list = list
  })
  await tick()
  is(c, 2)
})

test('each: rewrite item', async () => {
  let el = h`<a><x :each="i in items" :text="i" :onx="e=>i++"/></a>`
  sprae(el, { items: [1, 2, 3] })
  is(el.innerHTML, `<x>1</x><x>2</x><x>3</x>`)
  el.childNodes[1].dispatchEvent(new window.Event("x"))
  is(el.innerHTML, `<x>1</x><x>3</x><x>3</x>`)
})

test('each: init within template', async () => {
  await tick()
  let el = h`<div><template :each="a in [1,2]">
      <a :x="a"><b :text="a"></b></a>
  </template></div>`;

  sprae(el);
  is(el.innerHTML, `<a x="1"><b>1</b></a><a x="2"><b>2</b></a>`)

  document.body.appendChild(el)
  console.log(el.innerHTML)
})
