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
* [x] Sandbox expressions: no global, no "scope" object name, no "arguments"
* ~~[x] report usignal problem~~ author is not really interested
* [x] `this` doesn't refer to element/scope in event handlers
* [x] :text="" empty values shouldn't throw
* [x] implement :with
* [x] update :value without losing focus / position
* ~~[x] run tiredown if element got removed from condition or loop (free memory)~~ no need just make sure no refs to elements stored
* [x] `sprae(el, newState)` can update element's state directly (as batch!?) -> must be tested against repeats in directives
* [x] :if :ref, :if :with -> context setters must come first always
* [x] :style="{'--x':value}"
* [x] :onkeydown.ctrl-alt-D
* [x] examples
  * [x] todomvc
  * [x] waveplay
* [x] evt modifiers
  * [x] once, capture, passive
  * [x] ...rest
* [x] parallel chains
* [x] Sandbox
* [x] Autorun
* [x] There's some bug with prostogreen not triggering effect. (caused by special array.length case)
* [x] Getters must become evaluable
* [x] `<li :each="item in items" :with="{collapsed:true}"><button :onclick='e=>collapsed=false'></li>`
* [x] ~~`:with="{likes:[], like(){ /* likes should not be undefined here */ }}"`~~ nah, it's fine
* [x] Reduce memory leak - via jsbenchmark example
  * [x] make disposers
  * [x] make sure internals are disposed as well
* [x] frameworks benchmark -> contrib to krausest
* [x] fix swapping rows error
* [x] make use of actual swapdom
* [x] fix removing last row issue
* [x] optimization:
  * [x] faster create rows
  * [x] faster replace all rows
  * [x] fix remove row perf issue
* [x] Make signals-proxy state actually lazy-init (now it's not)
* [x] Fix multiple `.push` cycle problem
* [x] ~~Make regular proxy state not causing infinite recursion~~ we don't hold to own proxy now
* [x] All FIXMEs
* [ ] no-state version
* [ ] take id key for :each from data, not prop
