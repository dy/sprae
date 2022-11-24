* [x] finish directives
* [x] better list diffing
* [?] ordered directives init (:each + :if vs :if + :each) -> find out if really needed and which is faster
* [?] autoinit -> too much maintenance burden
* [ ] node tests
* [x] better deps updating -> cumulative signal
* [x] combinations: :else :if
* [x] :each :if, :if :each
* [x] :each :each
* [ ] :with must be able to write state value as well
* [ ] expand to any subscribables: both as state vars
* [ ] docs: give example to each directive
* [ ] initialize per-element: <x :each><y :if></y><x> - tree-dependent (:each comes first).