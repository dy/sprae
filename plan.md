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
* [ ] expand to any subscribables: both as state vars
* [x] docs: give example to each directive
* [x] initialize per-element: <x :each><y :if></y><x> - tree-dependent (:each comes first).
* [ ] optimization: arrays with multiple elements can be slow on creation. Maybe signal-struct must ignore arrays.