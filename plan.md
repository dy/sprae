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
  * [ ] replace :ref with :with="this as x"
* [ ] optimization: replace element-props with direct (better) setters
  * [ ] Make sure `false` gets serialized, not removes attr
* [ ] report usignal problem
* [ ] :onconnect, :ondisconnect
* [ ] frameworks benchmark
* [ ] examples
  * [x] todomvc
  * [ ] wave-edit
* [ ] Sandbox expressions: no global, no "scope" object name, no "arguments"