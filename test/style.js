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

  params.style = { "--x": 123 };
  await tick();
  is(el.style.getPropertyValue("--x"), "123");

  params.style = { top: "1px", bottom: "2px" };
  await tick();
  is(el.outerHTML, `<x style="left: 1px; top: 1px; bottom: 2px;"></x>`);

  params.style = { top: "2px", bottom: null };
  await tick();
  is(el.outerHTML, `<x style="left: 1px; top: 2px;"></x>`);

  params.style = { backgroundColor: 'gray' };
  await tick();
  is(el.outerHTML, `<x style="left: 1px; background-color: gray;"></x>`);
});
