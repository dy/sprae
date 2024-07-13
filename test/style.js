import test, { is, any, throws } from "tst";
import { tick, time } from "wait-please";
import sprae from '../sprae.js'
import h from "hyperf";

test("style: basic", async () => {
  let el = h`<x style="left: 1px" :style="style"></x>`;
  let params = sprae(el, { style: "top: 1px" });
  is(el.outerHTML, `<x style="left: 1px; top: 1px"></x>`);

  params.style = { top: "2px" };
  await tick();
  is(el.outerHTML, `<x style="left: 1px; top: 2px;"></x>`);


  params.style = { top: "1px", bottom: "2px" };
  await tick();
  is(el.outerHTML, `<x style="left: 1px; top: 1px; bottom: 2px;"></x>`);

  params.style = { top: "2px", bottom: null };
  await tick();
  is(el.outerHTML, `<x style="left: 1px; top: 2px;"></x>`);
});

test("style: props", async () => {
  let el = h`<x :style="style"></x>`;
  let params = sprae(el, { style: {} });
  is(el.outerHTML, `<x></x>`);

  params.style = { "--x": 123 };
  await tick();
  is(el.style.getPropertyValue("--x"), "123");

  params.style = { "--x": null };
  await tick();
  is(el.style.getPropertyValue("--x"), '');
});

test("style: camel kebab", async () => {
  let el = h`<x :style="style"></x>`;
  let params = sprae(el, { style: { backgroundColor: "red" } });
  is(el.outerHTML, `<x style="background-color: red;"></x>`);

  params.style.backgroundColor = 'green'
  is(el.outerHTML, `<x style="background-color: green;"></x>`);
});

test('style: #33', async () => {
  let el = h`<header class="navbar" :style="{ color: 'white', backgroundColor: '#df0000' }" />`
  sprae(el)
  is(el.outerHTML, `<header class="navbar" style="color: white; background-color: rgb(223, 0, 0);"></header>`)
})
