import test, { is } from "tst";
import { tick, time } from "wait-please";
import sprae from '../sprae.js'
import h from "hyperf";


test.skip("events: async", async () => {
  let el = h`<div :onx="e => {await v = 1; log.push(v);}"></div>`;
  let state = sprae(el, { log: [] });
  el.dispatchEvent(new window.Event("x"));
  is(state.log, []);
  await tick(1);
  is(state.log, [1]);

  let el2 = h`<div :onx="e => {1; log.push(1);}"></div>`;
  let state2 = sprae(el2, { log: [] });
  el2.dispatchEvent(new window.Event("x"));
  is(state2.log, []);
  await tick(1);
  is(state2.log, [1]);
});

test("events: t̵h̵i̵s̵ ̵c̵o̵n̵t̵e̵x̵t̵ event target", () => {
  // NOTE: we disregard this context, since we can obtain it from event target
  let el = h`<div :onx="event => log.push(event.target)"></div>`;
  let state = sprae(el, { log: [] });
  el.dispatchEvent(new window.Event("x"));
  is(state.log, [el]);
});

test("events: multiple events", () => {
  let el = h`<div :onscroll:onclick:onx="event=>log.push(event.type)"></div>`;
  let state = sprae(el, { log: [] });

  el.dispatchEvent(new window.Event("click"));
  is(state.log, ["click"]);
  el.dispatchEvent(new window.Event("scroll"));
  is(state.log, ["click", "scroll"]);
  el.dispatchEvent(new window.Event("x"));
  is(state.log, ["click", "scroll", "x"]);
});

test("events: once", () => {
  let el = h`<x :onx.once="e => (x && log.push(x))" ></x>`;
  let s = sprae(el, { log: [], x: 1 });
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

test("events: capture, stop, prevent", () => {
  let el = h`<x :onx.capture="e => log.push(1)"><y :onx="e => log.push(2)"></y></x>`;
  let state = sprae(el, { log: [] });
  el.firstChild.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, [1, 2]);

  let el2 = h`<x :onx="e => log.push(1)"><y :onx.stop="e => log.push(2)"></y></x>`;
  let state2 = sprae(el2, { log: [] });
  el2.firstChild.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state2.log, [2]);
});

test("events: window, self", () => {
  let el = h`<x :onx.self="e => log.push(1)"><y :onx.window="e => log.push(2)"></y></x>`;
  let state = sprae(el, { log: [] });
  el.firstChild.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, []);
  el.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, [1]);
  window.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, [1, 2]);
});

test("events: parent, self", () => {
  let el = h`<x><y :onx.parent="e => log.push(1)"></y><z></z></x>`;
  let state = sprae(el, { log: [] });
  el.firstChild.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, [1]);
  el.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, [1, 1]);
  window.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, [1, 1]);
  el.lastChild.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, [1, 1, 1]);
});

test("events: keys", () => {
  let el = h`<x :onkeydown.enter="e => log.push(1)"></x>`;
  let state = sprae(el, { log: [] });
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "" }));
  is(state.log, []);
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter" }));
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "" }));
  is(state.log, [1]);
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter" }));
  is(state.log, [1, 1]);
});

test("events: key combinations", () => {
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

test("events: keys with prevent", () => {
  let el = h`<y :onkeydown="event => log.push(event.key)"><x :ref="el => x=el" :onkeydown.enter.stop></x></y>`;
  let state = sprae(el, { log: [], x: null });
  console.log(state)
  state.x.dispatchEvent(new window.KeyboardEvent("keydown", { key: "x", bubbles: true }));
  console.log("enter");
  state.x.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  is(state.log, ["x"]);
});

test("events: debounce", async () => {
  let el = h`<x :onkeydown.debounce-1="event => log.push(event.key)"></x>`;
  let state = sprae(el, { log: [] });
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "x", bubbles: true }));
  is(state.log, []);
  await time(2);
  is(state.log, ["x"]);
});

test("events: debounce 0", async () => {
  let el = h`<x :onkeydown.debounce-0="e => log.push(e.key)"></x>`;
  let state = sprae(el, { log: [] });
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "x", bubbles: true }));
  is(state.log, []);
  await time(2);
  is(state.log, ["x"]);
});

test("events: throttle", async () => {
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

test('events: in-out events', () => {
  let el = h`<x :onmousedown..onmouseup="(e) => (x=e.target, log.push(e.type), e=>log.push(e.type))"></x>`

  let state = sprae(el, { log: [], x: null })
  el.dispatchEvent(new window.Event('mousedown'));
  is(state.x, el);
  is(state.log, ['mousedown'])
  el.dispatchEvent(new window.Event('mouseup'));
  is(state.log, ['mousedown', 'mouseup'])
})

test('events: toggle', async () => {
  let el = h`<x :onx..onx="e=>(log.push(1),e=>log.push(2))"></x>`
  let state = sprae(el, { log: [] })
  console.log('dispatch x')
  el.dispatchEvent(new window.KeyboardEvent('x'));
  is(state.log, [1])
  console.log('dispatch x')
  el.dispatchEvent(new window.KeyboardEvent('x'));
  is(state.log, [1, 2])
  console.log('dispatch x')
  el.dispatchEvent(new window.KeyboardEvent('x'));
  is(state.log, [1, 2, 1])
  console.log('dispatch x')
  el.dispatchEvent(new window.KeyboardEvent('x'));
  is(state.log, [1, 2, 1, 2])
})

test('events: chain of events', () => {
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

test('events: parallel chains', () => {
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

test.skip('events: parallel chains', () => {
  // NOTE: covered above
  let el = h`<div :onx..ony..onz="e=>('x',log.push(e.type),e=>('y',log.push(e.type),e=>('z',log.push(e.type))))"></div>`
  let state = sprae(el, { log: [] })

  console.log('emit x')
  el.dispatchEvent(new window.Event('x'));
  is(state.log, ['x'])
  console.log('emit x')
  el.dispatchEvent(new window.Event('x'));
  is(state.log, ['x', 'x'])
  console.log('emit y')
  el.dispatchEvent(new window.Event('y'));
  is(state.log, ['x', 'x', 'y', 'y'])
  console.log('emit y')
  el.dispatchEvent(new window.Event('y'));
  is(state.log, ['x', 'x', 'y', 'y'])
  console.log('emit z')
  el.dispatchEvent(new window.Event('z'));
  console.log('emit y')
  el.dispatchEvent(new window.Event('y'));
  is(state.log, ['x', 'x', 'y', 'y', 'z', 'z'])
  el.dispatchEvent(new window.Event('z'));
  is(state.log, ['x', 'x', 'y', 'y', 'z', 'z']);
  el.dispatchEvent(new window.Event('x'));
  is(state.log, ['x', 'x', 'y', 'y', 'z', 'z', 'x']);
})

test('events: state changes between chain of events', async () => {
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

test('events: modifiers chain', async () => {
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
