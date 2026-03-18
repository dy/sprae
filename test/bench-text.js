// Benchmark :text directive append performance
import { tick } from "wait-please";
import sprae from '../sprae.js'
import h from "hyperf";
import test, { is, ok } from "tst";

test("text: append performance (growing string)", async () => {
  let el = h`<div :text="waveform"></div>`;
  let state = sprae(el, { waveform: '' });

  // simulate waveform decode: append ~100 chars per chunk, 50 chunks
  let chunk = 'x'.repeat(100);
  let t0 = performance.now();

  for (let i = 0; i < 50; i++) {
    state.waveform += chunk;
    await tick();
  }

  let dt = performance.now() - t0;
  console.log(`50 appends of 100 chars: ${dt.toFixed(0)}ms, final length: ${state.waveform.length}`);
  is(el.textContent.length, 5000);
  ok(dt < 500, `should be under 500ms, got ${dt.toFixed(0)}ms`);
});

test("text: append performance (large string)", async () => {
  let el = h`<div :text="waveform"></div>`;
  let state = sprae(el, { waveform: '' });

  // simulate large file: 200 chunks of 200 chars = 40,000 chars
  let chunk = '\u0100\u0300'.repeat(100); // wavefont-like chars with combining marks
  let t0 = performance.now();

  for (let i = 0; i < 200; i++) {
    state.waveform += chunk;
    await tick();
  }

  let dt = performance.now() - t0;
  console.log(`200 appends of 200 chars: ${dt.toFixed(0)}ms, final length: ${state.waveform.length}`);
  is(el.textContent.length, 40000);
  ok(dt < 2000, `should be under 2000ms, got ${dt.toFixed(0)}ms`);
});

test("text: no circular re-trigger on append", async () => {
  let el = h`<div :text="waveform"></div>`;
  let updates = 0;
  let origText = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
  // spy on textContent reads
  Object.defineProperty(el, 'textContent', {
    get() { updates++; return origText.get.call(this); },
    set(v) { origText.set.call(this, v); }
  });

  let state = sprae(el, { waveform: '' });
  updates = 0;

  state.waveform = 'hello';
  await tick();

  let readsPerUpdate = updates;
  console.log(`textContent reads per update: ${readsPerUpdate}`);
  // should be small (2-3 reads: equality check + startsWith + maybe one more)
  // NOT growing with number of effects (circular re-trigger)
  ok(readsPerUpdate < 10, `expected < 10 reads, got ${readsPerUpdate}`);

  updates = 0;
  state.waveform = 'hello world';
  await tick();
  console.log(`textContent reads for append: ${updates}`);
  ok(updates < 10, `expected < 10 reads for append, got ${updates}`);
});
