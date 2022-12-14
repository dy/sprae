* [x] finish directives
* [x] better list diffing
* [x] ordered directives init (:each + :if vs :if + :each) -> find out if really needed and which is faster
  -> yes, needed and solve many init issues.
* [?] autoinit -> too much maintenance burden
* [x] node tests
* [x] better deps updating -> cumulative signal
* [x] combinations: :else :if
* [x] :each :if, :if :each
* [x] :each :each
* [x] :with must be able to write state value as well
* [x] docs: give example to each directive
* [x] initialize per-element: <x :each><y :if></y><x> - tree-dependent (:each comes first).
* [x] generalize common attributes :prop="xyz"
* [x] spread props
* [x] optimization: arrays with multiple elements can be slow on creation. Maybe signal-struct must ignore arrays.
  -> yep: arrays are rarely changed as `a[i]=newItem` and regularly they're mapped.
* [x] expand to any subscribables: both as state vars
* [x] :ref
* [x] :ref + :each
* [x] event chains :ona-onb
* [x] bulk events :ona:onb
* [x] multiprop setter :a:b="c"
* [x] make `this` in expression an element
  * ~~[x] replace :ref with :with="this as x"~~
* [x] :ref creates instance in current state, not creates a new state
  * [x] to avoid extending signal-struct, we must collect state data before, and call updates after for extended state
* [x] optimization: replace element-props with direct (better) setters
  * [x] Make sure `false` gets serialized, not removes attr
* [ ] Sandbox expressions: no global, no "scope" object name, no "arguments"
* ~~[x] report usignal problem~~ author is not really interested
* [x] `this` doesn't refer to element/scope in event handlers
* [x] :text="" empty values shouldn't throw
* [x] implement :with
* [x] update :value without losing focus / position
* ~~[x] run tiredown if element got removed from condition or loop (free memory)~~ no need just make sure no refs to elements stored
* [x] `sprae(el, newState)` can update element's state directly (as batch!?) -> must be tested against repeats in directives
* [x] :if :ref, :if :with -> context setters must come first always
* [ ] frameworks benchmark
* [ ] examples
  * [x] todomvc
  * [x] waveplay
* [ ] modifiers
  * [ ] value.bind
  * [ ] prop.boolean, .number, .string, .array, .object
  * [ ] prop.reflect, prop.observe
  * [ ] prop.once, prop.fx ?
  * [ ] prop.change - run only if value changes
  * [ ] prop.throttle-xxx, prop.debounce-xxx
  * [ ] prop.class
  * [ ] onevt.x, onevt.y
  * [ ] onevt.once
  * [ ] onevt.passive, onevt.capture
  * [ ] onevt.prevent, onevt.stop
  * [ ] onevt.outside onevt.window, onevt.document, onevt.self
  * [ ] onevt.throttle-xxx, onevt.debounce-xxx
  * [ ] onevt.shift, onevt.cmd.shift, onevt.meta
  * [ ] onkey.enter, .space, .up|.down|.left|.right, .escape, .tab, .period, .slash, .caps-lock