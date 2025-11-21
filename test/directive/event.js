import { tick, time } from "wait-please";
import sprae from '../../sprae.js'
import h from "hyperf";
import test, { any, is } from "tst";

const _dispose = Symbol.dispose;


test("on: event target", async () => {
  let el = h`<div :onx="event => log.push(event.target)"></div>`;
  let state = sprae(el, { log: [] });
  await tick();
  console.log('----- el.dispatchEvent')
  el.dispatchEvent(new window.Event("x"));
  is(state.log, [el]);
});

test("on: event with modifier", async () => {
  let el = h`<div :onx.debounce="event => (log.push(event.type) )"></div>`;
  let state = sprae(el, { log: [] });
  console.log('----- before tick')
  await tick();
  console.log('----- el.dispatchEvent')
  el.dispatchEvent(new window.Event("x"));
  await tick()
  is(state.log, ['x']);
  el[_dispose]();
  console.log('----- after dispose el.dispatchEvent')
  el.dispatchEvent(new window.Event("x"));
  await tick()
  is(state.log, ['x']);
});

test("on: this context", async () => {
  let el = h`<div :onx="log.push(this)"></div>`;
  let state = sprae(el, { log: [] });
  await tick();
  console.log('----- el.dispatchEvent')
  el.dispatchEvent(new window.Event("x"));
  is(state.log, [el]);
});

test("on: multiple events", async () => {
  let el = h`<div :onscroll:onclick:onx="event=>log.push(event.type)"></div>`;
  let state = sprae(el, { log: [] });
  // await tick();
  console.log('----- el.dispatchEvent click')
  el.dispatchEvent(new window.Event("click"));
  await tick();
  is(state.log, ["click"]);
  el.dispatchEvent(new window.Event("scroll"));
  is(state.log, ["click", "scroll"]);
  el.dispatchEvent(new window.Event("x"));
  is(state.log, ["click", "scroll", "x"]);
});

test("on: once", async  () => {
  let el = h`<x :onx.once="e => (x && log.push(x))" ></x>`;
  let s = sprae(el, { log: [], x: 1 });
  await tick();
  el.dispatchEvent(new window.Event("x"));
  is(s.log, [1]);
  el.dispatchEvent(new window.Event("x"));
  is(s.log, [1]);
  // should not react on changes signals from outside
  console.log("--- x=2");
  s.x = 2;
  el.dispatchEvent(new window.Event("x"));
  el.dispatchEvent(new window.Event("x"));
  is(s.log, [1]);
});

test("on: capture, stop, prevent", () => {
  let el = h`<x :onx.capture="e => log.push(1)"><y :onx="e => log.push(2)"></y></x>`;
  let state = sprae(el, { log: [] });
  el.firstChild.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, [1, 2]);

  let el2 = h`<x :onx="e => log.push(1)"><y :onx.stop="e => log.push(2)"></y></x>`;
  let state2 = sprae(el2, { log: [] });
  el2.firstChild.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state2.log, [2]);
});

test("on: window, self", () => {
  let el = h`<x :onx.self="e => log.push(1)"><y :onx.window="e => log.push(2)"></y></x>`;
  let state = sprae(el, { log: [] });
  console.log('----dispatch el x')
  el.firstChild.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, []);
  console.log('----dispatch el x')
  el.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, [1]);
  console.log('----dispatch window x')
  window.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, [1, 2]);
});

test("on: parent, self", () => {
  let el = h`<x><y :onx.parent="e => log.push(1)"></y><z></z></x>`;
  let state = sprae(el, { log: [] });
  console.log('--------- dispatch el.firstChild x')
  el.firstChild.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, [1]);
  console.log('--------- dispatch el x')
  el.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, [1, 1]);
  console.log('--------- dispatch window x')
  window.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, [1, 1]);
  console.log('--------- dispatch el.lastChild x')
  el.lastChild.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, [1, 1, 1]);
});

test("on: outside", () => {
  let el = h`<x :onx.outside="e => log.push(1)"><y :onx.outside="e => log.push(2)"></y></x>`;
  document.body.appendChild(el);
  let state = sprae(el, { log: [] });
  console.log('----dispatch el x')
  el.firstChild.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, []);
  console.log('----dispatch el x')
  el.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, [2]);
  console.log('----dispatch window x')
  document.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, [2, 1, 2]);
  document.body.removeChild(el);
});


test("on: keys", () => {
  let el = h`<x :onkeydown.enter="e => log.push(1)"></x>`;
  let state = sprae(el, { log: [] });
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "" }));
  is(state.log, []);
  console.log('---- Enter')
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter" }));
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "" }));
  is(state.log, [1]);
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter" }));
  is(state.log, [1, 1]);
});

test("on: key combinations", () => {
  let el = h`<x :onkeydown.ctrl-enter="e => log.push(1)"></x>`;
  let state = sprae(el, { log: [] });
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "" }));
  is(state.log, []);
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter" }));
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "" }));
  is(state.log, []);
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", ctrlKey: true }));
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter" }));
  is(state.log, [1]);
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter" }));
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", ctrlKey: true }));
  is(state.log, [1, 1]);

});

test("on: keys with prevent", () => {
  let el = h`<y :onkeydown="event => log.push(event.key)"><x :ref="el => x=el" :onkeydown.enter.stop></x></y>`;
  let state = sprae(el, { log: [], x: null });
  state.x.dispatchEvent(new window.KeyboardEvent("keydown", { key: "x", bubbles: true }));
  console.log("enter");
  state.x.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  is(state.log, ["x"]);
});

test("on: debounce", async () => {
  let el = h`<x :onkeydown.debounce-1="event => log.push(event.key)"></x>`;
  let state = sprae(el, { log: [] });
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "x", bubbles: true }));
  is(state.log, []);
  await time(2);
  is(state.log, ["x"]);
});

test("on: debounce 0", async () => {
  let el = h`<x :onkeydown.debounce-0="e => log.push(e.key)"></x>`;
  let state = sprae(el, { log: [] });
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "x", bubbles: true }));
  is(state.log, []);
  await time(2);
  is(state.log, ["x"]);
});

test("on: throttle", async () => {
  let el = h`<x :onkeydown.throttle-10="event => log.push(event.key)"></x>`;
  let state = sprae(el, { log: [] });
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "x", bubbles: true }));
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "x", bubbles: true }));
  is(state.log, ["x"]);
  await time(5);
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "x", bubbles: true }));
  is(state.log, ["x"]);
  await time(10);
  is(state.log, ["x", "x"]);
  await time(10);
  is(state.log, ["x", "x"]);
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "x", bubbles: true }));
  is(state.log, ["x", "x", "x"]);
});


test("on: function with braces", async () => {
  let el = h`<div :onx="e => { log.push(1); }"></div>`;
  let state = sprae(el, { log: [] });
  el.dispatchEvent(new window.Event("x"));
  is(state.log, [1]);
});

test("on: async inline", async () => {
  let el = h`<div :onx="let v = await Promise.resolve().then(()=>(1)); log.push(v);"></div>`;
  let state = sprae(el, { log: [] });
  el.dispatchEvent(new window.Event("x"));
  is(state.log, []);
  await tick(1);
  is(state.log, [1]);
});

test("on: async function", async () => {
  let el = h`<div :onx="async e => { let v = await Promise.resolve().then(()=>(1)); log.push(v); }"></div>`;
  let state = sprae(el, { log: [] });
  el.dispatchEvent(new window.Event("x"));
  is(state.log, []);
  await time();
  is(state.log, [1]);
});


test('on: in-out events', () => {
  let el = h`<x :onmousedown..onmouseup="(e) => (x=e.target, log.push(e.type), e=>log.push(e.type))"></x>`

  let state = sprae(el, { log: [], x: null })
  el.dispatchEvent(new window.Event('mousedown'));
  is(state.x, el);
  is(state.log, ['mousedown'])
  el.dispatchEvent(new window.Event('mouseup'));
  is(state.log, ['mousedown', 'mouseup'])
})

test('on: toggle', async () => {
  let el = h`<x :onx..onx="e=>(log.push(1),e=>(log.push(2)))"></x>`
  let state = sprae(el, { log: [] })
  console.log('----- dispatch x')
  el.dispatchEvent(new window.KeyboardEvent('x'));
  is(state.log, [1])
  console.log('----- dispatch x')
  el.dispatchEvent(new window.KeyboardEvent('x'));
  is(state.log, [1, 2])
  console.log('----- dispatch x')
  el.dispatchEvent(new window.KeyboardEvent('x'));
  is(state.log, [1, 2, 1])
  console.log('----- dispatch x')
  el.dispatchEvent(new window.KeyboardEvent('x'));
  is(state.log, [1, 2, 1, 2])
})

test('on: chain of events', () => {
  let el = h`<div :onmousedown..onmousemove..onmouseup="e=>(log.push(e.type),e=>(log.push(e.type),e=>log.push(e.type)))"></div>`
  let state = sprae(el, { log: [] })

  el.dispatchEvent(new window.Event('mousedown'));
  is(state.log, ['mousedown'])
  el.dispatchEvent(new window.Event('mousemove'));
  is(state.log, ['mousedown', 'mousemove'])
  el.dispatchEvent(new window.Event('mouseup'));
  is(state.log, ['mousedown', 'mousemove', 'mouseup'])
  el.dispatchEvent(new window.Event('mouseup'));
  is(state.log, ['mousedown', 'mousemove', 'mouseup'])
  el.dispatchEvent(new window.Event('mousedown'));
  is(state.log, ['mousedown', 'mousemove', 'mouseup', 'mousedown'])
})

test('on: parallel chains', () => {
  let log = []

  // 1. skip in event and do directly out
  let el = h`<x :onin.1.stop.immediate..onout.stop.immediate="io" :onin.2.stop.immediate..onout.stop.immediate="io"></x>`
  sprae(el, {
    io(e) {
      log.push(e.type)
      return (e) => (log.push(e.type), [1, 2, 3])
    }
  })

  el.dispatchEvent(new window.Event('out'));
  is(log, [])

  // 2. Some nonsensical return is fine
  el.dispatchEvent(new window.Event('in'));
  is(log, ['in'])
  el.dispatchEvent(new window.Event('out'));
  is(log, ['in', 'out'], 'out triggers right')
  el.dispatchEvent(new window.Event('out'));
  is(log, ['in', 'out'])
  el.dispatchEvent(new window.Event('in'));
  is(log, ['in', 'out', 'in'])
  el.dispatchEvent(new window.Event('in'));
  is(log, ['in', 'out', 'in', 'in'])
  el.dispatchEvent(new window.Event('out'));
  is(log, ['in', 'out', 'in', 'in', 'out'])
  el.dispatchEvent(new window.Event('out'));
  is(log, ['in', 'out', 'in', 'in', 'out', 'out'])
})

test('on: state changes between chain of events', async () => {
  let el = h`<x :onx..ony="fn"></x>`
  let log = []
  let state = sprae(el, { log, fn: () => (log.push('x1'), () => log.push('y1')) })
  console.log('emit x')
  el.dispatchEvent(new window.Event('x'));
  is(log, ['x1'])
  console.log('update fn')
  state.fn = () => (log.push('x2'), () => log.push('y2'))
  await tick()
  is(log, ['x1'])
  // console.log('xx')
  // NOTE: state update registers new chain listener before finishing prev chain
  el.dispatchEvent(new window.Event('x'));
  el.dispatchEvent(new window.Event('x'));
  is(log, ['x1'])
  console.log('emit y, y')
  el.dispatchEvent(new window.Event('y'));
  el.dispatchEvent(new window.Event('y'));
  is(log, ['x1', 'y1'])
  console.log('emit x')
  el.dispatchEvent(new window.Event('x'));
  is(log, ['x1', 'y1', 'x2'])
  console.log('emit y, y')
  el.dispatchEvent(new window.Event('y'));
  el.dispatchEvent(new window.Event('y'));
  is(log, ['x1', 'y1', 'x2', 'y2'])
})

test('on: modifiers chain', async () => {
  let el = h`<x :onkeydown.letter..onkeyup.letter="e=>(log.push(e.key),(e)=>log.push(e.key))"></x>`
  let state = sprae(el, { log: [] })
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'x', bubbles: true }));
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  is(state.log, ['x'])
  el.dispatchEvent(new window.KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
  is(state.log, ['x'])
  el.dispatchEvent(new window.KeyboardEvent('keyup', { key: 'x', bubbles: true }));
  is(state.log, ['x', 'x'])
})

test('on: unfinished sequence', async () => {
  let el = h`<x :onx..ony="e=>(log.push(e.type))"></x>`
  let state = sprae(el, { log: [] })
  el.dispatchEvent(new window.Event('x'));
  is(state.log, ['x'])
  el.dispatchEvent(new window.Event('y'));
  is(state.log, ['x'])
  el.dispatchEvent(new window.Event('x'));
  is(state.log, ['x', 'x'])
  el.dispatchEvent(new window.Event('x'));
  is(state.log, ['x', 'x'])
})


test('on: alias sequence', async () => {
  let el = h`<x :ona.debounce:onb.debounce..onc.debounce:ond.debounce="e=>(log.push(e.type),(e)=>log.push(e.type))"></x>`
  let state = sprae(el, { log: [] })
  console.log('---------- emit a')
  el.dispatchEvent(new window.CustomEvent('a', { bubbles: true }));
  is(state.log, [])
  await tick(2)
  is(state.log, ['a'])
  console.log('---------- emit a, b')
  el.dispatchEvent(new window.CustomEvent('a', { bubbles: true }));
  el.dispatchEvent(new window.CustomEvent('b', { bubbles: true }));
  await tick(2)
  is(state.log, ['a'])
  console.log('---------- emit d')
  el.dispatchEvent(new window.CustomEvent('d', { bubbles: true }));
  is(state.log, ['a'])
  await tick(2)
  is(state.log, ['a','d'], 'd fulfilled')
  console.log('---------- emit c, d')
  el.dispatchEvent(new window.CustomEvent('c', { bubbles: true }));
  el.dispatchEvent(new window.CustomEvent('d', { bubbles: true }));
  await tick(2)
  is(state.log, ['a','d'])
  console.log('---------- emit b')
  el.dispatchEvent(new window.CustomEvent('b', { bubbles: true }));
  is(state.log, ['a','d'])
  await tick(2)
  is(state.log, ['a','d','b'])
  el.dispatchEvent(new window.CustomEvent('b', { bubbles: true }));
  el.dispatchEvent(new window.CustomEvent('a', { bubbles: true }));
  await tick(2)
  is(state.log, ['a','d','b'])
  el.dispatchEvent(new window.CustomEvent('c', { bubbles: true }));
  is(state.log, ['a','d','b'])
  await tick(2)
  is(state.log, ['a','d','b','c'])

  el[_dispose]()
  el.dispatchEvent(new window.CustomEvent('a', { bubbles: true }));
  el.dispatchEvent(new window.CustomEvent('b', { bubbles: true }));
  el.dispatchEvent(new window.CustomEvent('c', { bubbles: true }));
  el.dispatchEvent(new window.CustomEvent('d', { bubbles: true }));
  await tick()
  is(state.log, ['a','d','b','c'])
})
