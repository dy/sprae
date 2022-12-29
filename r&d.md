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
* sprea
  + inherits sprae
  + prea(ct)
  + spree and spread
  + something priya
  + anagram: parse, spare, spear
  + river: https://en.wiktionary.org/wiki/Sprea
  + spring
  - sprae has nice ae ligature
  - sprae is closer to spray
  - sprae is closer to a verb

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

## [ ] :with? -> let's use `:with="{x:1,y:2,z:3}"` for now

  1. Get rid of :with
    + with is bad JS practice/association
    +? is there a bona-fide use case?
    + the implementation is heavy/unoptimal: two assign-updates happen: for root, for children
    + it is exception blocking streamline implementation of refs
    + it shadows data which creates all sorts of nasty debugging effects / states. Isn't it better to keep data/state transparent?
      + it even enables transparency of :each scopes, since they inherit root scope
    + it's easier to look out for data in one single place (state init), rather than in a bunch of markup locations
    +?! can be replaced with sort of `<x :xyz="xyz=...calc"></x>`, no?
      -> would need wrapping noname scope access
    + `:with` defines too many concerns:
      * binds root updates -> child updates;
      * binds child updates to root updates (writes);
      * defines local variables
      * aliases root variables
      ? is there value in all of these concerns? It seems we need only local variables, isn't it? Is there a chance partial extension can be required?
    - `:with` can provide situational variables that are useful for props precalculation (since these variables can be reactive.)
      * eg. `<span class="preloader" :with="{str: ''}" :init="setTimeout(() => str+='.', 500)" :text="str" />`
      * that plays role of watch that doesn't require to be outside of local component state.
    - `:with` allows local component state not cluttering global state. There's really no way to define local state that doesn't affect global state.
  1.1 Slim `:with="{a,b,c}"` - just initializes vars
    - Doesn't give easy init syntax
    + Convevtional and not hard to implement
  2. Use `:let="x, y=2"`?
    + Doesn't pollute scope but instead cleanly declares local variables
    + Indicates only local initializer, not subscription
    + Liquid has `assign` tag `{% assign myVar = false %}` - it only initializes variable
    + Django `with` performs only alias / complex calc access https://docs.djangoproject.com/en/4.1/ref/templates/builtins/#with - it doesn't sync up global state.
    ? call it `:define="x, y, z"`?
      -> it seems `:with="x=1, y=2"` works well. `:let` has dissonance with js'y let.
    ? how to extend state
  3. `:with.x="1", :with.y="2"`
    + easier to parse, since init code can be _messy_

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

## [x] Keep className marker of directive or not? -> no

-> No: first, there's :class directive changing the class itself;
-> Second, there's easier way to just "evaporate" directive = not initialize twice;
-> Third, there's too much pollution with class markers

## [x] :html? ->  Nope: can be implemented via any prop

  - introduces malign hole of including sprae inside of html
  - nah: can easily be done manually as `:html="this.innerHTML = abc"`. Just need passing context

## [x] :fx? -> nah, already works. Just return `null` in any attr, that's it.

  * let's wait for use-case
  - doesn't necessarily useful, since any directive is already an effect
  + works already out of box, just creates `fx` attribute if value is returned

## [x] :init? -> same as :fx="initCode", but let's have :oninit event.

  * waiting for use-case
  -> it's better to init element via js than via inline code. Gotta add `:oninit` event.

## [x] :key.enter? -> no, can be done manually

  - opens gateway to generic modifiers
  - introduces a whole mental layer to learn, including combinations of modifiers all around.
  - can be conflicting with event classes.
  - too adhoc-y
  - can be easily done as `:onkeypress="e => e.key === 'Enter'"`
  -> waiting for use-case

## [x] :key:boolean="abc" -> nope: can be done manually

  ? do we really need typecast?
  - it can be done manually as `:key="Boolean(abc)"`

## [x] `this` in expressions must refer to current element or scope? -> to current element

  1. `this === element`
    + Allows this.innerHTML and other customs
      - Can be done easily via `:ref="xxx"`
        + External handlers don't have access to refs.
    + Existing convention
  2. `this === scope`
    - scope is not supposed to be extendible
    - scope is already available
    + methods provided in `init` may not have access to scope _yet_.
      ~- not reliable way to obtain scope via `this.x` - better be explicit as `state.x`

## [x] :onconnected/:ondisconnected? -> nah, just use noname effect or external functionality eg fast-on-load

  + can be useful for :if, :each handlers, eg to start animation when element appears in DOM.
  - it is not connected-disconnected: it has nothing to do with document: it attaches/detaches from parent.
  - connected-disconnected is too long name
  ? attach-detach?
  ? onmount-onunmount?
    - slows down domdiff
    - can be solved as `<x :if="xxx" :="xxx ? (...) : '">` automatically

## [x] :focus="direct code", :evt="direct code" -> nah, too messy.

  + makes proper use-case for direct code events
  - doesn't make sense for rective properties inside
  + better fit for special props like `:mount`
  - tons of new special-meaning namespace props

## [x] Chain of events: often useful to have shared context. -> Try `:onstart..onend`

  * focus/blur, connected/disconnected, mousedown/mouseup, keydown/keyup, touchstart/touchmove/touchend, dragstart/dragover/dragend, animationstart/animationover/animationend, transitionstart/transitionend
  ? is there a way to organize handlers for chains of events?
    1. :onfocus:onblur="e => e => {}"
      - :onblur looks more like a pseudo
      + a bit better distinctive visually, less noisy
      - combining root-level attrs them doesn't seem very intuitive for fn waterfall.
    2. :onfocus-blur="e => e => {}"
      - ? is there dash-events? looks like a single event
      - ? why not :on-focus-blur
      - ? why not :onfocus-onblur
      + can be converted from on="{ focusBlur: event }" via dash notation
        - messy error messages
      + less :on prefixes
      + has better "flowy" meaning
    * 2.1 :onfocus-onblur="e => e => {}"
      + distinctive visually as 1
      + flowy nature of 2
      - blocks `:onfile-attached` and other dashed events
        - `ona-onb` vs `ona-b-onc` is hard to parse mentally
    3. :onfocus.onblur="e => e => {}"
      - looks like a modifier
      - . can be used as event class onclick.x
    4. `:onfocus--blur="e => e => {}"`
      + reminds BEM
      - reminds BEM
    5. `:onfocus..blur="e => e => {}"`
      + reminds range
      + literally means start..end
      + all pros of 2.
      + reminds spray via dots
      - can be confusing if `blur` is event or just property (can that be a property?)
    6. `:onfocus..onblur="e => e => {}"`
      + all props of 5.
      + more obvious that blur is event.

    4. `:onfocus="e => e => {}"` Keep registered pairs of events: just expect focus return blur, etc.
      + Shorter syntax
      + Avoids :onfile-attachment-accepted problem
      - Less verbose and explicit
      - No way to customize sequences, eg.  custom events

## [ ] Plugins

* ~~@sprae/tailwind: `<x :tw="mt-1 mx-2"></x>` - separate tailwind utility classes from main ones; allow conditional setters.~~
* @sprae/item: `<x :item="{type:a, scope:b}"` – provide microdata
  - can be solved naturally, unless there's special meaning
* @sprae/hcodes: `<x :hcode=""` – provide microformats
* @sprae/with
* @sprae/onconnected
* @sprae/onvisible?

## [x] Write any-attributes via `:<prop>? -> yep`

+ Since we support attr walking, maybe instead of :on and :prop just allow any attributes?
  + that would allow event and attr modifiers...
  + that would allow somewhat alpine/vue-compatible code
+ makes sense for `:="{}"` spread
+ makes place for other specific directives `:init=""` etc

## [x] :value is confusing: <option> also uses that. -> let's skip for now: onchange is not a big deal

? :model="value"
  + v-model, x-model
  - confusing
? :in="text"
? :input="text"
? :bind="value"
  + more accurate logically
  - conflicts with existing naming (bind is used for attrs)
  - conflict if used along with `:value="x" :bind="y"`
-> :value="value" :onchange="e=>value=e.target.value"
  + more apparent and explicit
  + less mental load, "model" is too heavy term
  + overhead is minimal
  + react-like
  + it has better control over serialization
  + `:onchange:oninput="e=>xyz"` is very good

## [ ] Sandbox? -> too complex for now. Waiting for use-cases

1. Use subscript?
  + solves access to any internal signals on syntactic level
    + can tentatively be faster than signal-struct
    + could tentatively get rid of struct and just use signals as input
      ~ Yep, it's a bit weird template converts data into some reactive state. Just expose an update method instead and current state like useState hook. This way you can avoid exposing signal-specific functions.
  + Provides precisely controlled sandbox
  - Some limited lang opportunities
    - need to match many syntax quirks, can be tedious
      ~ can be fine to limit expressions to meaningful default: why Proxy, generators, awaits, global access etc.
  - Somewhat heavy to bundle
    ~ 1-2kb is not super-heavy, besides signal-struct kicks out
  + Scope is easier to provide: no need for signal proxy
  + Can detect access errors in advance
  + Syntax-level access to signals can be inavoidable: external signals still "leak in" (via arrays or etc.).
  + Updating simple objects should also rerender the template parts, not just signals.
  + Deps can be analyzed / implemented without signals
  - Screwed up debugging / stacktrace (unless errored)
  + that "unlimits" returned struct, so that any property can be added/deleted.
  - doesn't really save from `new (()=>{}).constructor` hack: we gotta substitute objects too.
  + allows easier handle of `:with="a=1,b=2,c=3"` - we just naturally get local variables without messup with global
    + we can even define locals without `let`...
  - not having "comfy" compatible JS at hand: cognitive load of whole language "layer" in-between

2. Use sandboxed proxy
  - tough evaluation
  - tough implementation
  - screwed up data
  - no full protection
  + does minimal catch

## [x] :onclick="direct code" ? -> no: immediately invoked.

  + compatible with direct `onclick=...`
  + no need for arrow/regular functions syntax in templates
    - still need that syntax for filters, maps etc
  + can be made async by default
  - illicit `event` object
  - conflicts with regular attrs logic: the code is immediately invoked and can assign a function.

## [x] Should getters convert to computed? -> yes, that's relatively cheap and useful

  + shorter and nicer syntax
  - possibly longer init

## [ ] Better :ref
  + :ref="`a-${1}`"
  + :id:ref="xyz"
  ? maybe id should have same signature
  ? should it be very similar mechanism to `:with="a=1,b=2"`

## [ ] Event modifiers :ona.once, `:ona`

  - .prevent,.stop - not needed since expects a function
    ? or should we just trigger it for user?
  ? :onclick.outside
  ? :onclick.window, :onclick.document
  ? :onclick.once
  ? :onclick.debounce
  ? :onclick.throttle.750ms
  ? :onclick.self
  ? :onspecial-event.camel, :onx-y.dot
  ? :onclick.passive
  ? :onkeypress.shift.enter
    .shift	Shift
    .enter	Enter
    .space	Space
    .ctrl	Ctrl
    .cmd	Cmd
    .meta	Cmd on Mac, Windows key on Windows
    .alt	Alt
    .up .down .left .right	Up/Down/Left/Right arrows
    .escape	Escape
    .tab	Tab
    .caps-lock	Caps Lock
    .equal	Equal, =
    .period	Period, .
    .slash	Foward Slash, /