## [x] name -> sprae

* rasa
* dew
* water
* humidify
* sprinkle
* va
* soma
* ley
* ros
* dewdrops
* mtn-dew
* pores
* drips
* straw
* spores
* spor
  + spores
  + russian
    - spor
  + sport
* spore
* sporae
  + scottish twist
  + sounds russian-ish too
  - a bit unusual from API perspective...
  + similar to algae
  + dots associate with colon prefix
* spour
* sprae?
  + reference to sporae and similar assoication
  + simpler word
  + better assoc with hydration


## [x] :attr, :data, :id, :class, :style, :on, :aria - do we enforce JS syntax or support unscoped expression? -> Use JS convention, too many use-cases.

1. JS object
+ JS object can directly set value as `:props="obj"`
- JS object is a bit verbose `:props="{a:1, b:2}"`, `:on="{click(e){}, touch(e){}}"`
  + It's very explicitly JS, no confusion must be introduced
- It makes HTML look a bit more noisy
+ It is more familiar
+ JS syntax saves redundant questions and an item from docs

2. Custom expressions
+ We anyways introduce custom-ish expression in `:each="item in items"`
  - Vue introduces simple-ish parsing for that
+ Custom expressions are shorter: `:attr="a:1, b:2, c:3"`
- Custom expressions are confusing for style: `:style="a:1, b:2, c:3"` - very similar to direct style string

## [ ] Attribute directive: `:={a:1}` vs `:attr={a:1}` vs `:prop={a:1}`

+ `:=obj` reminds pascal assignment operator, which is cool
+ `:={a:1,b:2}` is natural convention from vue/alpine as - all props in object are assigned as `:{attr}`

## [ ] Scopes mechanism: prototype inheritance chain vs multiple `with` wrappers

- prototype inheritance chain causes deps update difficulties
- prototype chain is messy-ish
- prototype chain is a bit more difficult to provide multiple parent scopes
- prototype state object is inheritance mess - can be super-hard to analyze
~ `with(a) with(b) with(c)` is the same as `with(a)` with prototype inheritance in terms of access.
- `with` chain allows runtime update of scopes, eg. child scope was updated to something new.
  - `prototype` chain is fixed from the time of init.
- `prototype` chain hails to unidentified root scope and inherits from that. Maybe we should clarify scopes inhertiance and first implement reactive store (see next item).

## [ ] Should we inherit values from `init` in `sprae(el, init)`, instead of creating a snapshot of reactive values in `init`?

+ it allows passing any arbitrary scope to initialize from.
- it can make hard finding reactive sources...
+ it is sort-of neat pattern: object parent updates its particular state: it can also have observable method making object a store
-> can be delegated to a separate functionality - init just gets converted to reactive store
+ it sort-of makes `init` directly a scope (a parent of scope), which is more natural-ish rather than 2 independent entities
+ can pass both observables and direct state anywhere, eg. init child components from it

## [ ] Per-directive initialize vs per-element initialize

+ Per-directive is very simple and trivial approach
- Per-directive doesn't read attributes order and init directives independently
  ~ Practically linear in-order init doesn't make much service either here