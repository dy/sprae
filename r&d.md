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
  + spree
  + spread
* sprinkle
  + better meaning
  - stands out less than sprae
* aerosol

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

## [x] Attribute directive: `:={a:1}` vs `:attr={a:1}` vs `:prop={a:1}` -> hold on for now

+ `:=obj` reminds pascal assignment operator, which is cool
+ `:={a:1,b:2}` is natural convention from vue/alpine as - all props in object are assigned as `:{attr}`
- We can use `:="{data}"` fro sprae autoinit, since scope has confusing name: `:scope={}`, `:sprae={}`, `:with={}`
-> let's use :prop= for now, since `:={}` can have multiple interpretations

## [x] Scopes mechanism: prototype inheritance chain vs multiple `with` wrappers -> init subtrees, no need for explicit mechanism

- prototype inheritance chain causes deps update difficulties
- prototype chain is messy-ish
- prototype chain is a bit more difficult to provide multiple parent scopes
- prototype state object is inheritance mess - can be super-hard to analyze
~ `with(a) with(b) with(c)` is the same as `with(a)` with prototype inheritance in terms of access.
- `with` chain allows runtime update of scopes, eg. child scope was updated to something new.
  - `prototype` chain is fixed from the time of init.
- `prototype` chain hails to unidentified root scope and inherits from that. Maybe we should clarify scopes inhertiance and first implement reactive store (see next item).

? what if we avoid scope inheritance mechanism (what's the real use for it?) and instead just make reactive store object, so that :with directive subscribes to any input props, but "shadows" subtree?
  ? are there uses for inheritance

? Do we need scopes at all? Only for the purpose of autoinit?
- it seems scopes can introduce more confusion and mess in templates: indicating full paths is more beneficial
  + unless we introduce proper ":with="item.x as x""
+ prototype chain is a single object:
  + meaning updators receive one actual-for-element scope instance
  + that makes external API easier
  + that allows handling store via single reactive object

-> possibly we have to just subscribe via mechanism of signals-like deps, and :with just initializes subtree with extended object

## [x] Should we inherit values from `init` in `sprae(el, init)`, instead of creating a snapshot of reactive values in `init`? -> nah, nice idea but too little use. Better create signals struct.

+ it allows passing any arbitrary scope to initialize from.
- it can make hard finding reactive sources...
+ it is sort-of neat pattern: object parent updates its particular state: it can also have observable method making object a store
-> can be delegated to a separate functionality - init just gets converted to reactive store
+ it sort-of makes `init` directly a scope (a parent of scope), which is more natural-ish rather than 2 independent entities
+ can pass both observables and direct state anywhere, eg. init child components from it
-> worthy of a separate library, signal-struct?

## [x] Per-directive initialize vs per-element initialize -> directives can immediately initialize rest on elements

+ Per-directive is very simple and trivial approach
- Per-directive doesn't read attributes order and init directives independently
  ~ Practically linear in-order init doesn't make much service either here
- Per-directive is a bit hard to deal with scopes
-> gotta benchmark, vs just walker.
-> seems unavoidable to combine :if within :each, since :each should remove elements and init on find only

## [x] avoid updating unchanged directives if values don't affect them -> signal struct

? what if we use preact/signals to subscribe only to required props?
-> parseExpr is going to need to be handled by core.js (not directives), and detect & subscribe to dependencies itself
-> so that directive updator gets invoked only when any of expr dependencies change
-> gotta solve via signal-struct

## [x] Replace :else-if with :else :if -> not ideal technically, but done

+ `:else :if=""` is meaningful expansion of both directives
+ `:else :if` is coming from JS
+ `:else :if` doesn't throw error in JSDOM tests
- less resemblance with vue: who cares, we already remotely resemble it

## [x] Keep className marker of directive or not?

-> No: first, there's :class directive changing the class itself;
-> Second, there's easier way to just "evaporate" directive = not initialize twice;
-> Third, there's too much pollution with class markers

## [ ] Plugins

* init/connected/mount, unmount/disconnected?
  * init and connected are different apparently
* :html?
* :effect?
* @sprae/tailwind: `<x :tw="mt-1 mx-2"></x>` - separate tailwind utility classes from main ones; allow conditional setters.
* @sprae/item: `<x :item="{type:a, scope:b}"` – provide microdata
* @sprae/hcodes: `<x :h=""` – provide microformats

## [ ] Write any-attributes via :<prop>?

+ Since we support attr walking, maybe instead of :on and :prop just allow any attributes?
  + that would allow event and attr modifiers...
  + that would allow somewhat alpine/vue-compatible code
+ makes sense for `:="{}"` spread
+ makes place for other specific directives `:init=""` etc

## [ ] :value is confusing: <option> also uses that.

? :model="value"
  + v-model, x-model
  - confusing
? :in="text"
? :input="text"
? :bind="value"
  + more accurate logically
  - conflicts with existing naming (bind is used for attrs)
  - conflict if used along with `:value="x" :bind="y"`
? :value="value" :onchange="e=>value=e.target.value"
  + more apparent and explicit
  + less mental load, "model" is too heavy term
  + overhead is minimal
  + react-like
