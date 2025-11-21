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

## [x] Acronyms

  * Simple progressive enhancement
  * Single purpose reasoning

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
- We can use `:="{data}"` from sprae autoinit, since scope has confusing name: `:scope={}`, `:sprae={}`, `:with={}`
-> let's use :prop= for now, since `:={}` can have multiple interpretations
-

## [x] What's a use-case for `:={props}` - do we need it? -> yes - setting reserved props or spread

  * {...props} is useful in react components to pass down all unmentioned or unknown props to children
    - but sprae is not about componentization
  ~+ some function returning spraed element `return sprae(el, props)` (external integration)
    - there props are not necessarily unlimited, is it ok to hard-define them?
  ~+ some web-component passing all attributes to children
    - web-components have hard-defined attributes
  ~+ say we render an `<input id="xyz" :="props"/>` - different type of input may have different set of props, would be insane to define all possible conditions in each prop
  ~+ passing props for various conditions, without if-else statements
  + allows setting same name as directive attrs like `:={each:1,if:2,ref=3,fx=4,text=5,scope=6}`

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

## [x] :with? -> ~~let's use `:with="{x:1,y:2,z:3}"` for now~~ ~~:with is poor shim for componentization; ~~ -> :scope/:with is needed for local evals, to prevent leaking values

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
      ~- imagine components rendered within :each or :template, every of them may have internal state
        +~ that seems more like a component concern, :with seems to provide a whacky hack to create scope/shadow
    - `:with` is main way to provide `auto` entry
      ~ we can sacrifice `auto`
    + can be replaced with `:='x=123'`
    - `:with` creates unnecessary updates, like one property updates whole object, and is often an overkill for memory.
  2. Use `:let="x, y=2"`?
    + Doesn't pollute scope but instead cleanly declares local variables
    + Indicates only local initializer, not subscription
    + Liquid has `assign` tag `{% assign myVar = false %}` - it only initializes variable
    + Django `with` performs only alias / complex calc access https://docs.djangoproject.com/en/4.1/ref/templates/builtins/#with - it doesn't sync up global state.
    ? call it `:define="x, y, z"`?
      -> it seems `:with="x=1, y=2"` works well. `:let` has dissonance with js'y let.
    ? how to extend state
    + It already just works via `:fx="x=1, y=2"` since we do sandboxing...

### [x] `:scope="a=1,b=2"` inline instead of with="{...}"? -> yes, but better do both

  + shorter syntax
  + on par with django, liquid
  ~ avoids js with association
  + enables per-variable effects
  + it's more natural for immediate scope to have access to vars `:fx="x=1,y=2,get=()=>x++"`
    * rather than creating a layer of store
  ? or `:define="a=1, b=2"`, `:let="a=1"`
  - can simply be done via `:fx="a=1, b=2"`
  - confusion in `:scope="x=1, {y: 2}"` - from code perspective these are two separate scopes, but we also expect effect to run in a new scope to define these variables
    ~+ it's alright to extend scope with defined object or even fn, but it must be run in a new scope

### [x] What's the best name for :scope/:with/:data? -> :scope, but :with is different directive.

  1. :with
    - bad remembrance of JS with
      +~ not necessarily the case
    - `:with="{x:1,y:2,get(){x+y}}"` has problem of immediate scope access, we need define variables instead
    - `:with` looks weird although it's supposed to make sense
  2. :scope
    + the most direct name for "block scope"
    + `js-scope` makes sense
    + can be used without data, just to indicate a separate scope
    + on par with petit-vue
    + allows autoinit only :scope parts
    - scope attribute is used for th
      ~ rare, but can be set via `:={scope:'xyz'}`
    - :scope/@scope is used in CSS
  3. :=
    - cannot be used on its own
  4. :local=""
  5. :ctx=""
  6. `:scope` and `:with` are different directives. First creates a block scope, second extends state with an object.

### [x] Should we extend `:with-<x>`, `:class-<x>`, `:style-<x>`, `:data-<x>`? -> no: duplication, syntax mismatch

  - just aliases for objects
  - unnecessarily complicates API
  - `:with-<x>` exposes variable name into attribute space, which is bad
  - `:data-<x>` is literally covered by default attribute handler
  - `:style---bar` is hard to parse and hard to read
  - all we need to solve is - make with not update whole thing
  ~ but what's the other way? we have to split per-variable effects...

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

## [x] Replace :else-if with :else :if -> yes

  + `:else :if=""` is meaningful expansion of both directives
  + `:else :if` is coming from JS
  + `:else :if` doesn't throw error in JSDOM tests
  - less resemblance with vue
    ~ we don't care as_much, alpine doesn't even have that
  - loses indicator that it's single token, it's still parsed in-relation
    ~ it should be separate tokens, like :else [do rest]
  - it can confuse `:if :else` for `:else :if` which is wrong

## [ ] :else-if token?

  + `:else.debounce-100 :if.debounce-200` is two separate commands, first adds token, second removes later
  * therefore if we reach `:else` that had no `:if` counterpart, likely that `:if` is prevented by inline `:else`, so we have to wait for it
  + `:else-if` can be more efficient: it would not initialize fully `:else` with children before going to `:if`. Essentially that would allow lazy init.

## [x] Keep className marker of directive or not? -> no

  -> No: first, there's :class directive changing the class itself;
  -> Second, there's easier way to just "evaporate" directive = not initialize twice;
  -> Third, there's too much pollution with class markers

## [x] :html? ->  ~~Nope: can be implemented via any prop~~ remove it

  - introduces malign hole of including sprae inside of html
  - can easily be done manually as `:ref="el => el.innerHTML = abc"`. Just need passing context
  + we may need non-strings, like DOM elements, templates, or just injecting element at particular place
  ? how do we instantiate template
    * `:ref => el => el.replaceChildren(sprae(tpl))`

## [x] :fx - to be or not to be? -> yes, useful

  * let's wait for use-case
  + allows avoiding `void` in justin
  - any directive is already an effect
  - works already out of box, just creates `fx` attribute if value is returned

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
    - can be solved as `<x :if="xxx" :="xxx && (...)'">` automatically

## [x] :onmount/onunmount? -> see :ref=el=>el

  + useful for :if, :each
  + useful to dispose listeners via :onunmount (opposed to hidden symbols)
  - doesn't really solve disposal: if element is attached again, it would need to reattach removed listeners
    -> can be solved via teardowns returned from updators
    -> nah, event listeners don't need collection, just make sure no refs to element remain
  + can be useful for lazy-loadings

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
      + compatible with JSX as `s-onfocus--onblur="..."`
        - not really
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

## [x] Store: sandbox? -> we need it anyways via Proxy, so yes

  - What for? We anyways expose almost everything.
    + To make eval safer.
      - we cannot provide absolute safety anyways

  1. Use subscript?
    + solves access to any internal signals on syntactic level
      + can tentatively be faster than signal-struct
      + could tentatively get rid of struct and just use signals as input
        ~ Yep, it's a bit weird template converts data into some reactive state. Just expose an update method instead and current state like useState hook. This way you can avoid exposing signal-specific functions.
    + Provides precisely controlled sandbox
    - Some limited lang opportunities
      - need to match many syntax quirks, can be tedious
        ~ can be fine to limit expressions to meaningful default: no Proxy, generators, awaits, global access etc.
    - Somewhat heavy to bundle
      ~ 1-2kb is not super-heavy, besides kicks out signal-struct (with preact signals?)
      + compared to including signals maybe not as much
    + Allows detecting precisely deps from syntax level, not deep-live-detection, which can be unwanted
    + Allows creating optimized evaluator, without proxy
    + Scope is easier to provide: no need for signal proxy
    + Can detect access errors in advance
    + Syntax-level access to signals can be inavoidable: external signals still "leak in" (via arrays or etc.).
    + Updating simple objects should also rerender the template parts, not just signals.
    + Deps can be analyzed / implemented without signals
    - Screwed up debugging / stacktrace (unless errored properly)
      ~+ can actually provide better trace since no internal framework stuff is shown
      + can let means to enhance subscript's logs
    + that "unlimits" returned struct, so that any property can be added/deleted.
    - doesn't really save from `new (()=>{}).constructor` hack: we gotta substitute objects too.
      ~ Proxy doesn't save from that either
      ~+ we can prohibit `new` and braces/functions in general, straight fn bodies
    + allows easier handle of `:with="a=1,b=2,c=3"` - we just naturally get local variables without messup with global
      + we can even define locals without `let`...
    - not having "comfy" compatible JS at hand: cognitive load of whole language "layer" in-between
      ~ `:each` is not js anyways
      + it's unsafe feeling (also CSP) having JS straight in attributes
      + there's certain hacks and limitations to JS anyways (we can't use let,const,var)
      + there's some established convention for jessie, justin, jsep etc.
      + not having full JS can be a good practice and protection agains unnecessary stuff
      + that can be a very common syntax
    + allows `let a = 1; a;` case instead of `let a = 1; return a;`
    - we can't identify dynamic parts like `x[y]`, whereas Proxy subscribe dynamically
      ~ we can detect dynamic parts and handle them on proxy
      + at least we know about dynamic reads
    + subscript allows subscriptions to async functions, unlike signals
    +? we can detect `array.length`, not sure what for
    * SO that can be a simplified subset of JS, like Jessie or Jason

  -> We can benchmark if updating set of known dependencies is faster than using preact subscriptions.
    + it seems more logical min-ground to know in advance what we depend on, rather than detect by-call as signals do.
    + it's safer not to depend on external tech, considering there's so much competition and changes in reactive land
    ~ it indeed takes some reactive-struct, capable of notifying which paths have been changed
      ? maybe define setters such that when they're set

  2. Use sandboxed proxy
  - tougher evaluation
  - no full protection (Function.constructor)
  - relatively slow
  + does minimal catch
  + allows scope control
  + allows dynamic subscription to requested fields ( no need for preact/signals neither for signal-struct )
  + we anyways need sandbox even in case of subscript

## [x] Store: how to organize array.length subscription? -> see signals-proxy

  * It causes recursion in `:x='array.push(x)'`

  0. Ignore arrays as insubscribable
  + allows signals-only store (signal-struct)
  + fastest
  - ignores array mutations, unless explicitly called

  0.a Abandon returning single-property store, in favor of batch-update
  + Simpler API
  + Very precise diff-update
  + No need for batch method
  ~ essentially encourages signals-proxy or proxy, since
    * why not exposing proxy as just props-access, that applies throttled batch-update (collects multiple updates and runs batch after)
    * since API allows only batch, why not allowing signals as single-prop entries

  1. Detect when `.length` is called within `.push/protoMethod` via method wrapping
  - doesn't solve generic implicit subscription, like `buf.write()` that calls implicitly subscribable `buf.size`

  2. Detect from source by subscript
  - limited syntax
  - heavier to bundle
  - messy stacktrace
  - no comfy js at hand
  - doesn't detect dynamic subs like `calc().length`

## [x] Store: strategies -> signals-proxy seems the most balanced for now

  1. Signals struct
    + fastest
    + limits access to not-existing props
    + seals object
    + no circular update trouble
    - doesn't handle arrays
    -~ no sandboxing
    -~ no dynamic props

  2. Proxy
    + any-prop access, including not-existing
    + modern-ish
    + own tech
    + allows handling arrays
      - some mess with .length subscription
    - doesn't take in individual signals
    - slow-ish
      ~ must be improved
    - some mess with proto access
      ~ must be improved
    - no circular update detection
    + allows detecting precisely what array ops were performed, to apply corresponding DOM updates

  3. Signals proxy
    + medium performance
    + no proxy store mess
    + subscriptions handled via signals (proved)
    + circular update detection
    - heavy-ish
    - not own tech
      + hi-quality though
    - doesn't solve recursive .length out of the box
      ~ alleviated by tracking

  4. Subscript-based something
  * Eg. we pass simple object, not store.
    * Subscript wraps prop access into reading `.valueOf()`, so we don't have to deal with signals in templates
    * Or we can even expose signals as-is, since they cast to their value in expressions and whatnot
  + that solves issue of CSP
  + that detects globals in-advance
  + that gives anticipated store schema
  ~ there's no update via proxy, reactivity is only via signals
    + fits web-components case
  -~ problems of subscript above
  - doesn't solve live arrays: they can only be signals
    ~+ which can be more explicit of what's going on
  ~ implies swapdom since full-array gets updated every time
    ~ can be better for updates than full-update as it is now
    + we anyways enforce full-update for object changes

## [x] :each over/undersubscription -> proxy-signals store solves that

  * we must subscribe to each item from the list - it should update itself only, not the whole list. How?

  1. Async reconciliation part - it plans list rerendering (loop part) in the next tick, and this tick may have as many item changes as needed

  2. Individual effects per-item `fx(() => {updateItem(list[idx])})`
    * Can be created in advance, and list updates only cause effects changes

  3. Nested effects: parent effects don't get subscribed in internal effects, so we just modify :each to create multiple internal effects per-item.
  + we might not need swapdom, since nodes manage themselves
  * note the untracked function

## [x] :onclick="direct code" ? -> ~~no: immediately invoked~~ can do, if a function then it is invoked.

  + compatible with direct `onclick=...`
  + no need for arrow/regular functions syntax in templates
    - still need that syntax for filters, maps etc
  + can be made async by default
  - implicit `event` object
    + we don't seem to ever need that event argument, many cases are covered by `.prevent` or `.stop`
    ~+ generally `e=>` seem to conflict logically with modifiers sense
  + `e=>` brings syntax burden - we may not ever need functions
    + less problem detecting `const/let` in code
  - conflicts with regular attrs logic: the code is immediately invoked and can assign a function.
  - `:oninput="e => (handleCaret(e), updateTimecodes())"`
    ~ `:oninput="handleCaret(event), updateTimecodes()"`
  - `:onbeforeinput="handleBeforeInput"`
    ~ `:onbeforeinput="handleBeforeInput(event)"`
  - `:ondragenter..ondragleave:ondragenter..ondrop="e=>(this.classList.add('w-dragover'),e=>this.classList.remove('w-dragover'))"`
    ~ `:ondragenter..ondragleave:ondragenter..ondrop="this.classList.add('w-dragover'), e=>this.classList.remove('w-dragover')"`
  - `:ondrop="e=>console.log(e.dataTransfer.types)||e.preventDefault()"`
    ~ `:ondrop.prevent="console.log(event.dataTransfer.types)"`
  - `:onfocus="e => (e.relatedTarget ? e.relatedTarget.focus() : e.target.blur())"`
    ~ `:onfocus="event.relatedTarget ? event.relatedTarget.focus() : event.target.blur()"`
  - `:onpopstate.window="e => goto(e.state)"`
    ~ `:onpopstate.window="goto(event.state)"`
  - `:onclick.toggle="play"`
    ~ `:onclick.toggle="play()"`

## [x] Should we introduce `@click` for short-notation events? -> let's keep `:onx` ~~for raw events, `@x` for normal events~~
  + gives shorter code for majority of cases
  + separates event reaction from prop reaction
  + compatible with all frameworks (vue, alpine, lucia, lit)
  + gives better meaning to modifiers - moves them outside of `:` attribute
  - multiple events `@input@change="code"` is not nice
    ~ that's fine and even meaningful
  - chain of events `@focus..@blur="return (e)=>{}"` creates confusing `return` outside of body, as well as inconsistent chain pattern
    ? remove that pattern
      + it's still unsatisfactory: `@mousedown.document..@mouseup.document="e=> (isMouseDown = true, e=> isMouseDown = false)"` works, but what if we want to add `@touchstart..@touchend`, or
        . `@click..@click="play" @keydown.alt-space..@keydown.alt-space="play"`, so in other words we need cross-reaction `@click_or_altspace..@click_or_altspace`, not just one single chain.
        + actually here `@click@keydown.space..@click@keydown.space` is possible, unlike `:ona..onb` case, the question is how to provide sequence in attribute
        + the thing is that local state, introduced by initiator events, is not useful by itself, detached from scope.
          . the state is better reflected in data scope, rather than by initiator event.
          ? what about temporaries like `@a..@b="id=setTimeout(),()=>clearTimeout(id)"` or `@a.toggle="stop=play(),stop"`
            . use `:with={id:null} @a="id=setTimeout()" @b="clearTimeout(id)"`
  - imposes illicit `event` variable ~ although compatible with standard, still obscure
    ~+ not always needed
  - `@` prefix is unchangeable ~ can be removed, not set, but still on the verge.
    ~+ can be customized
  - `@click.toggle="code"` has same problem as `@a..@b` - how can we make code separation in attribute?
    + remove toggle
  + overall less code
    - unless user prefers `:onclick="e=>()"`
  - just a synonym to `:onclick="e=>()"` which doesn't bring own value
  - `:onclick=e=>()` is self-obvious (more obvious)
  - `@click="something, e => somethingOut"` is weird code and makes implicit event explicit

## [x] Multiple chain events resolution -> redirect to main event for now
  * Consider
  ```
  :onclick..onclick="play"
  :onkeydown.document.alt-space..onkeydown.document.alt-space="play"
  ```
  * When started by click and ended by alt-space, it doesn't clear the onclick
  * We actually want here `:onclick:onkeydown.document.alt-space..onclick:onkeydown.document.alt-space`.
    - this makes inconsistency of `..onclick` - colon is missing
    - also it makes precedence of `:` and `..` unclear - what comes before what after.

  ? Can we use `:onclick.toggle="play"`?
    - it doesn't help with switch-over across different event starters
  ? Some 'or' character `:onclick--onkeydown`
  ? We can redirect to main event, that's it for now

## [x] Events chain (sequence): parallel or sequential? -> let's keep sequential, for parallel use stop.immediate.1

  * `:onclick..onclick="play"` - it doesn't work as toggle because we allow parallel execution, so second onclick gets superceded by first one. Do we need that?
  - we can limit parallel events pool via `:onclick.1..onclick :onclick.second..onclick`
  - `:onclick..onclick` is more obvious/explicit/uniform than `:onclick.toggle`
  ? do we ever need cases when we need parallel execution?

## [x] Should getters convert to computed? -> yes, that's relatively cheap and useful

  + shorter and nicer syntax
  - possibly longer init

## [x] Better :ref -> functional style like react + name style like :value

  1. should we merge `:ref` and `id`, eg. expose all ids by default?
    + it saves code, eg. `id="artwork" :ref="artwork"` is very common construct
    + `id` is exposed IN WINDOW even
    + we don't use effect for ref anyways, it's once-set
    - `id` has nothing to do with sprae attributes

  2. should we make `ref` a string?
    + allows `:ref:id="'some-value'"`
    - dynamic ref is not what we want
      - confusable with `:ref="abc"` which should be expect as variable

  3. `:with="{x:this}"`
    - we don't use `this`

  4. `:ref="el=>el.style='abc'"`
    + we can use that to initialize element
    + it looks like ref in react
    + it allows for more robust initialization: no need to write to state
    + it makes it more explicit to expose element in state `:ref="(el, state) => state[name] = el"`
      - 2nd argument - not nice
    - can be called `:oninit` or `:onconnected` with same effect
    ? how to expose ref to state
      * `sprae(el, {x:null})`, `<x :ref={el => x=el}></x>`
    ? how to expose local ref
      * `<li :each="el in list" :with={x:null} :ref={el=>x=el}>`

  5. 4 + 1
    + `:value` can take simple prop path and will save value there
    + same time `:ref` can take path and work in reverse

## [x] Initializing element -> see :ref=el=>el

  * The problem sprae has with initializing element: we need to run some code to init some handler (eg. autosize), similar to spect.
  * But we don't have `:oninit`.
  * Also, since we don't have `this` - it is problematic to get reference to element.
  * We can try to use `:ref` for that, ref creates value in state, which is undesired.

## [x] Event modifiers :ona.once, `:ona` -> let's try, there's a lot of use for both props and event

  - .prevent,.stop - not needed since expects a function
    ? or should we just trigger it for user?
  ? :onclick.outside
  ? :onclick.window, :onclick.document
    + can be needed, eg. mousedown..up can happen outside of current element (stop caret tracking in waveplay)
  ? :onclick.once, :onclick.passive, :onclick.capture
    + can pass props to event listener: there's no other way to do that
  ? :onclick.debounce-330
  ? :onclick.throttle-750
    + ...just handy everydayers and saves tons of noise
  ? :onclick.self
    ~ clicked on self, not the child
  ? :onspecial-event.camel, :onx-y.dot
    ~
  ? :onkeypress.shift.enter, :onmousemove.shift, :onmousemove.alt
    .shift	Shift
    .enter	Enter
    .space	Space
    .ctrl	Ctrl
    .cmd	Cmd
    .meta	Cmd on Mac, Windows key on Windows
    .alt	Alt
    .up .down .left .right
    .escape	Escape
    .tab	Tab
    .caps-lock	Caps Lock
    .equal	Equal
    .period	Period
    .slash	Foward Slash
    + allows separating various key handlers: atm waveplay handles separate keys in the same method `handleKey`
    + allows tracking mouse interactions with shift hold
  - conflict with dot-separated events
    ~not so popular nor encouraged
  - lots of ad-hoc non-standard rules, can be handled in code
  + allow multiple setters for same props or multiple listeners for same events
  + oldschool jquery-compatible events

  * [x] Event modifiers
    * [x] onevt.x, onevt.y
      + jquery-like
      + multiple same events
    * [x] onevt.once, onevt.passive, onevt.capture
      + standard props passing
    * [x] onevt.prevent, onevt.stop
      + conventional mods
    * [x] onevt.outside onevt.window, onevt.document, onevt.self
      + useful handlers, conventional mods
    * [x] onevt.throttle-xxx, onevt.debounce-xxx
      + conventional
    * [x] onevt.shift, onevt.cmd.shift, onevt.meta
      + conventional
    * [x] onkey.enter, .space, .up|.down|.left|.right, .escape, .tab, .period, .slash, .caps-lock
      + conventional
    * [x] onkey.nexttick
      + seems to be needed, but what's the name?
      * onkey.tick, onkey.nexttick, onkey.next,
      * onkey.after, onkey.microtask, onkey.defer, onkey.immediate
      * onkey.tick-1?

## [x] Writing props on elements (like ones in :each) -> nah, ~~just use `:x="this.x=abc"`~~ use ref

  1. `:x="abc"` creates property + attribute
    - can be excessive pollution

  2. `.x="abc"`
    ~ `:x.x=""` writes both property and attribute...
    - conflicts with class selector
    - blocks dot-separated values
    - breaks convention of reserved namespace via `:`

  2.1 `_x="abc"`
    - conflicts with `_target="blank"`

  3. `:.x="abc"`
    + keeps convention
    + compatible with `:on*`
    - can be a bit too noisy syntax

  4. `:_x`
    + reference to "private"
    - conflicts with `:_target="blank"`

  5. `:x="this.x=value"`
    + yepyepyep

## [x] Insert content by reusing the node/template -> use ~~`:render="ref" :with="data"`~~ ~~`:html="ref" :scope="{}"`~~ :ref="item=>item.innerHTML=..."

  * Makes easy use of repeatable fragments, instead of web-components
  + sort-of "detached" for-each
  + reinforces :ref
  ? does it replace element or puts a content?
  * Refs:
    * https://github.com/justinfagnani/html-include-element - src=
    * https://www.npmjs.com/package/imported-template - content=path-to-file
    * https://github.com/SirPepe/html-import src="content.selector"
    * https://github.com/Juicy/juicy-html - html="rawhtml"
    * https://www.npmjs.com/package/html-import-wc - src=path
    * https://github.com/sashafirsov/slotted-element - src=path-to-htmlor-json
    * https://github.com/webcomponents/html-imports - href=filepath
    * https://github.com/giuseppeg/xm - import src=filepath
    * https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-include-html#link-tag-html-only
    * https://github.com/maherbo/include-HTML-document-fragment - link href=path
    * https://github.com/github/include-fragment-element - src=path-to-html

  1. :use="ref-id"
  ```
  <template :ref="abc" id="abc"><span :text="abc"></span></template>

  <div :use="abc" :with="{abc:'def'}"></div>
  <div :use="'#abc'" :with="{abc:'def'}"></div>
  ```

  - `<use>` from SVG replaces element, but we need inserting content

  2. :content="#template-id"

  - conflicts with direct inline content

  3. :include="#template-id"

  - conflicts with path to file

  4. :tpl="#template-id"

  - some confusion of meaning

  5. :render="#template-id"

  + compatible with liquid 5.0
  + makes sense as :render=a :with=b

  * Let's think consequently.
    1. `<template>` element has direct purpose for that
    2. We provide content fallback for unloaded elements in case of `:text` as `<x :text="abc">fallback</x>`
    3. There's too many ways to implement fetching - ideally we leave that concern out and focus only on including content
    4. The approach is almost ready declarative custom element. `<template>` is standard part of it - adds to 1.

  6. :scope="{$template:xxx}"

  + like petite-vue
  - some special prop is needed

## [x] Remove non-essential directives :aria, :data -> yep, less API friction
  * :aria - can be defined via plain attributes
  * :data - confusable with :scope, doesn't provide much value, can be used as `:data-x=""` etc
  * :={} - what's the meaning? Can be replaced with multiple attributes, no? No: no easy way to spread attributes.

## [x] let/const in expressions: allow or prohibit -> let's prohibit, force user to wrap into a function himself

  - allowing forces wrapping internally, which creates return statement confustion

## [x] Take over parent signals, rather than inherit?

  - Parent state can dynamically obtain new signal, and nested states won't have access to that

## [x] Is there a way to predefine store static / dynamic props via signals? -> let's try no-store

  * Since exposing signals in templates didn't seem to have worked well, we can predefine state values instead of creating a proxy.
  - props would need to be predefined in advance
  + it must simplify tracking new props in object (we just prohibit that)
  * see no-state branch

## [x] No batch? -> let's try

  + less API
  + anyways updating every prop reflects DOM update immediately, there doesn't seem to be a big win
  + multiple props can be combined into computed signal or called manually via batch

### [x] What should we do with `this` in case of subscript? -> we get rid of that and use `:ref`
  * It doesn't ship keywords by default
  1. We can do Object.create(state, {this:{value:el}})
    - created for each effect - too much
    - bloats memory
    + we need it anyways for setting variables within context
  2. ~~We can call subscript function with `this` in context~~ we can't, subscript reads from context
  3. We can statically detect `this` and define handlers for it (it can be only read/set props)
  4. Is there a way to get access to element somehow otherwise?
    - `this` as well as `event` is most conventional way.
    - `this` literally points to _this element_.
  4.1 ~~! Should we introduce unary `#ref` for immediately querying element by id?~~ nah, messy
    + `<div :html="#tpl"/>` - render external template
    + `<li :x="item=#"/>` - ref
    - `:html="#my-element"` is not valid js
    ~ same can be done as `:html="$('tpl')"` but it's messy
  5. Should we keep `:ref`, which allows us to avoid implicit `this`?
    - it has implicit assignment, we can maybe rename it to `:as`

### [x] Should we include functions? -> yes, without them is hard, also arrow fns are no-keywords
  + Allows array ops like `Array.from({length:1}, (_,i)=>i*2).join('')`
    ~ there's an opinion this code is too complex
  - makes directives more complex, wonder if that complexity is better done via JS (too complex scripts are unwelcomed)
  - opens doubts for `:on="()=>{}"`
    - not allowing functions would prohibit setting `:on` attributes
  * let's hold on with them until need like air
  * We need them for mainly array methods `(items.every(item => item.done))`
    - iterating over arrays is prone to perf problems, better expose state
  * For `setInterval()`
    - opens unsafe eval
      ~ we don't seem to be able to stop it.
    - usually it means separate scope is needed (component)
  + Can be better alternative to iterator proposals
  - opens gateway to eval like `new ((()=>()).constructor)('arbitrary JS')`
    ~ unless we prohibit `new` operator
    - `setTimeout('string')` does either

### [x] How do we handle @a@b? Is that some special attribute kind? -> we have arrow fns, keep as is
  1. Register attributes with full name, eg. `directives['@xx']=...`
    - we are supposed to register any-events
  2. We can follow the convention that `@` is `addEventListener` fn body, `:` is prop

### [x] Should we include async/await? -> ~~make all functions async and all calls await~~ no, that's a sign cb should be external
  + it allows naturally to await promises etc
  - there's an opinion that async/await is a mistake: use signals
  * likely async is an indicator that code must be organized via JS, templates are not for heavy async logic

### [x] What should we do with tagged strings :id="`item-${id}`"? -> keep strings `'item-' + id` ~~with placeholders `'item-$<id>'`~~
  1. Prohibit
    . `:class="['a', b, 'c']"`
      + built-in clsx
    . `:id="['item-',id].join('')"`
    . `:class='"foo " + bar + " baz"'`
      + classic JS
      + more-or-less cross-lang
      - not so easy to read
  2. Invent alternative
    . `"foo $bar baz"` (Bash, Perl, Kotlin, PHP)
    . `"foo %s baz" % bar` (Python, Go)
      - nah, learning new synax is no-go
  3. Prefixed directive `$class="foo {bar} baz"`
    - nah
  4. regex.replace-like `:class="'a $<name> b'"`
    + implementable as `values.join('|').replace(attr)`
    - doesn't allow complex expressions inside of `$<>`
    - syntax parsers complain
    - doesn't look trustworthy, like unnecessary ad-hoc complication - just use + man
  5. Register directive similar to :ref as `class="a {b} c"`
    - That's natural advantage of template-parts
  6. Implement via subscript...

### [x] Should we allow var, let, const? -> no, write to scope instead -> ~~we may need scope defined per-element~~ we keep :scope
  + we have fn body in handlers
  * `const all = todos.every(item => item.done)
    save(todos = todos.map(item => (item.done = !all, item)))``
  1. Can do `this._x = ...`
    - needs `this`
  2. Can do `x = ...` - writing to local state instance
    + allows `this`
    - enforces local state
  3. Can do `x = ...` - writing to global state
    + enabled already

## [x] Imagine dom-signals. What would be redundant in sprae? -> let's try using nadis + subscript
  * :text, :class, :style, :value, :prop, :props, :render/:html - just simple writer signals
    * `elText = text(el, 'init'); elText.value=123`, `elClass = cl(el, init)`, `elContent = html(el, init)`
  * :if, :each - can be controllable too, more complicated since act in-context
    * `items = each(el, (items)=>children)`, `cond = if(el, cond); cur = select([el1,el2,el3], 0)`
  * :ref, :with/:scope, :set act in-context, modify data for nested levels
    * :ref is questionable, but do we really need scope? let's try to answer once again.
    * the main purpose of :with from examples is component scope, like shadow.
    * secondary purpose is defining per-item property not belonging outside.
    * in other words, it's cheap componentization (in react done as separate component).
      * instead of :with, we can use `template = :render(el, data, template?)`
        + that would enforce good practice of obvious scope
        * which is essentially `sprae(el, data, template?)` - with template, content is replaced; without template content is hydrated.
          * `with(el, data)` === `sprae(el, data)` in terms of signals
      * alternatively (ideally) we just pass props to another custom element and let it handle internals

  * splitting off such signals would
    + make lightweight hyperf implementation (no fear of heavy stuff), signals: html`${a}`, str`${a}+${b}`
    + make controllable element dom-signals
    + allow plugin system
    -> let's call that project nadi

## [x] Template syntax -> nice research, but outside of sprae scope, see define-element r&d

  1. `attr={{value}}`
  2. `:attr="value"`
  3. `attr="{value}"`

## [x] #14: Should we introduce fragments rendering via template directives `<template :if="..."` -> yes, that's meaningful scope delineation: :if, :each, :scope etc
  * That seems to be in-line with `<tempalte :each="...">` - logically these both create placeholder element
  * `<template :define` can be implemented as plugin
    * generally we have to carefully design plugins system
  + template is used as immediate/fragment in declarative shadow dom and custom elements proposals
  ? other uses might be: `:scoped` to run template in isolated (iframe) context

## [x] Should we convert input init state to signals? -> no, only internal scopes

  + unified output state API
  + makes sense of returning modified state
  - doesn't modify initial state
  - performance hit: not everything needs to be a signal, also slows down rendering

## [x] Init signals: how? -> `sprae.use(signals)`, but internally

  1. `sprae.config({signals})`, `sprae.setup({signals})`
    + universal
    + allows other configs: async, compare, compiler etc.
      - some choices can be made beforehead (async, compare, compiler)
    + points at 1-time call
    - not optimal in terms of size

  2. `sprae.signals(signals)`
    + short
    + likely we're not going to need to configure anything else
    - duplicate name `signals(signals)`

  3. `sprae.set({signals})`, `sprae.use(signals)`
    + mocha, express
    + short
    - doesn't work with other params like `sprae.use({async:true})`

  4. `sprae.signals = signals`

## [x] How to export signals? -> ~~`sprae/signal` seems to be most meaningful~~, but keep .use, import sprae, {signal}

  1. `import sprae, {signal, effect} from 'sprae'`

  - not clear which signals are these
  - enforces signal exports
  - enforces `sprae.use` to switch signals
    - which is also not small
      + requiring / calling `sprae.signal` everywhere is more to size than once-assigning
      + `sprae.use` is more obvious than `sprae.signal = xxx`

  2. `import sprae from 'sprae'; import { signal, effect } from 'sprae/signal'`

  - separate import entry
  + signal is automatically registered & coupled with sprae
  + doesn't enforce `sprae.use` / `Object.assign(sprae, signals)`
    - `sprae.use` is more compact than `sprae.signal` everywhere
  - directives depend on signals, we cannot throw them away = we don't need `sprae/signal` entry

  3. `import sprae from 'sprae'; import * as ulive from 'ulive'; Object.assign(sprae, ulive); const {signal} = ulive;`

  - very verbose
  - no convenient destructuring

## [x] How do we organize updatable state? -> let's try to keep effects out of directives

  1. Make signals optional, update state via returned function
    + no signals = smaller
    - not clear how to organize the directives code: `effect` is still needed if we use signals
    - enforcing signals config is too much, they must be available immediately
  2. Keep `state` as signal, register `state.value`
    - harder dependence on signals
    + solves issue
    - a bit verbose: needs initializing with signal detection
      - which adds to size
    - it's also less clear: it causes some infinite loops hard to trace back
      - generally understanding update dependency is harder
  3. we always return `effect` anyways: we can return `update` function instead and handle effect outside
  + this way we'd be able to call update independent of effect
  + we handle effect disposal in centralized way, not per-directive

## [x] What should we return from `sprae` call? -> we return reactive state

  1. ~~state signal~~
    - not clear what sort of signal is that
    - no access to props: lame
  2. state.value
    + actual state...
  3. dispose
    + conventional
    - no access to state
  4. element itself
  + chaining

## [x] CSP approaces -> ~~let's use wired-in justin until otherwise needed~~ -> we need to provide switchable compiler to make code smaller

  1. Wired-in by default (non-customizable)
    + easier
    + less maintenance efforts: sandboxing & syntax out of the box, less docs
    + CSP by default
    + subscript included as dependency
    + minimal style
    - size (>5kb), ~5.4kb
    - doesn't really protect from constructor.constructor
    - it makes code heavier for component applications where we don't care about unsafe eval
  2. Separate CSP entry
    + similar to Alpine
    + ability to choose best option
      ~ not sure if that's a value - making user think
    - maintaining separate entries
      - risk of conflict / friction / non-identical code (discrepancies of justin/js)
  3. Customizable compiler by user
  + single CSP entry
  - formally non-CSP-enabled
  - even if CSP is configured, bundle can be detected as unsafe since it has `new Function`

## [x] Should we autosubscribe to direct signal read? -> nah, let's not create friction

  + That's what preact authors wanted & encourage
    - it will become different from preact effects code
  - That makes syntax incompatible with JS compiler
  - that blows up code a bit configuring subscript
  - that enforces writing signals too, we can't `a = value` anymore
  ? is that obvious enough?

## [x] Signals-store instead of explicit signals? -> yes, let's try, too many benefits

  + bench shows arrays / objects better
  + bench shows it's possibly better memory-wise
  + it's way less code for array ops: no need to create signals here and there, no need for bumping prop
  + it allows attributes code forget about signals
  + no need for DOM swapper algo
  + it makes sense as output from sprae to be reactive proxy store
  + it allows internal code to care less about what's signal what's not
  + generally it makes signals mechanism implicit and optional - API-wise user cares less about what should be a signal what not
  - possibly some bit more of memory/perf cost, since static values get wrapped into signals
  ? can we optimize static array values instead of being a bunch of signals instead be one signal?

## [x] Should we make store notify about diff props, rather than length? -> nah, too complex

## [x] Should we create per-object signal, instead of per-property? -> No
  - it gives less granular updates: full array gets diffed, all nodes get refreshed

## [x] Should we replace `:each="item in items"` to `:each.item="items"`? -> no, we stick to parse redefine

  - non-conventional
  + `:each` is the only exception that needs custom expr parsing

### [x] Should we oversubscribe/overparse instead of custom parsing (double-parse)? -> no, we stick to parse redefine

  + we already use sub-effect, so we can parse again and subeffect again
  - returned function is handled asynchronously

### [x] The best way to redefine eval -> return `{eval}`

  1. `dir.parse = expr => expr`
  2. `dir = (,trigger) => trigger.eval = parse(expr).bind(el)`
  3. `dir => ({ eval:... })`
    + `eval` is more flexible than `expr`: can bind it to proper element, can redefine complete function / parser
    + returning extra props on output can redefine part of internal context, not just updater
  4. `function* dir() { yield expr|eval; return ...}`
    + organic flow
    + allows redefining expr and out function
    - slight overhead for micro/sprae to run iterator
    + allows returning independent off, not conditioned by modifiers

### [x] When signal with array is used as store value {rows:signal([1,2,3])} - what's expected update? -> let's make it full reinit array, since it's most direct

  1. Remove all, replace all - store plain array
  2. Swap via swapdom etc
    - heavy, makes no sense as store
  3. Force signal value into a store, update store
  + we anyways can even with regular stores rewrite to null
  - duplication: we'd need to store the store somewhere
    - we'd need to sync up array with internal store somehow
  - pointlessness: whenever signal updates to new array we have to reinit our store

## [x] Should we separate store to array/struct? -> yes, cleaner logic

  + different length tracking
  + structs can be not lazy unlike arrays
  - store can change from object to array...
    ~ we can prohibit that
  + object/array have quite different diffing logic:
  + objects don't need length
  + arrays don't need setters/getters
  + arrays don't usually have parent scopes

## [x] Can we use Object.create for :each scope? -> ~~no, let's make it flat~~ - yes, it's more performant

  - We need `:ref="el"` to inject element instance per-item
    + We don't really need to create a separate scope for that, we can just preset ref only for subscope
  - It's not good to expose per-item props like `:fx="x=123"` to the root
    ~+ why? actually that allows to have access to both local scope and root scope
  - We can't really avoid creating new scopes in `:scope="{}"`, can we?
    ? Is it better to keep root scope as mutation holder
    + `:with={}` wasn't supposed to define scope, it's just defining variables
  + It would allow us to get rid of `parent` in `store`, which is less static + dynamic trouble
  + `:scope` defines only particular local variables, but generally access to root scope is preserved

## [x] Should :each create own scope (or keep parent scope)? -> Let's try shallow object.create with only two props

  + allows `:ref`
    ~ can be done as `:scope :ref='x'`
  - performance hit
  ~ we don't really need it as much, do we?

### [x] Should :ref create own scope instead? -> Let's try defining property instead

  - doesn't expose item to the parent state
    ~ :each with scopes doesn't expose either

## [x] Should we pre-parse directives? -> no, breaks chains

  + :a:b -> :a :b decoupling
    + shorter init code
    - breaks chains :a:b..:c:d
  + enables forwarding, eg. :else -> :else :if=1
    ~ entails modifiers handling, which makes them unified
    - sole purpose

## [x] _stop flag instead of _state = null -> let's wait until needed

  + Presence of state doesn't indicate if item should be prevented on init.
    + Eg. `:else :scope :text :on`

## [x] store: should we prohibit creation of new props? -> no

  + Structs make objects nice: small, fast, obvious
  - Difficulty for arrays: we cannot really avoid creating new props there
    + What if we separate arrays to own `list` type of store?
  + We can define scopes via `:with` for new props
    + and that naturally prevents leaking variables
  ? Do we need extending root scope? Like writing some new props to it?
  + `with` doesn't allow writing new props anyways

## [x] store: should we have write transparency for parent, ie instead of creating new prop we write to a parent? -> yes, write transparency
  * `<x :scope="x=1"><y :scope="y=2,x=1"></y></x>`
  ? Is y going to write x to the `<x>` scope, or create own instance?
  - Object prototype chain creates new props
  ~ In js it can be `let x=1; { let y = 2, x = 3;}` but we also can write `x` from nested scopes...
  - we cannot easily access full prototype chain, only nearby parent
  + Alpine has write transparency, but it creates new values in the root scope, not local one

  1. Alpine principle: find closest scope where variable is defined.
    - But then we have to make a special rule for `:scope` directive to _only define_ variables, which is modal creation
    - Also hoisting to the global scope is not good
  2. We write to parent if variable is defined there, otherwise we create it locally
    + Solves `:scope` issue
    - Since we do sandboxing, we

## [x] Pause/resume components (detached :if should not trigger internal fx) -> complete disposal cycle

  1. `paused` flag per-effect
    - @preact/signals unsubscribes from previously subscribed props
    - requires every single effect to handle `paused` flag

  2. keep track of effects, detach/reattach
    - separate mechanism over _dispose - requires flags etc

  3. dispose / resprae via setAttributeNode
  + completes disposal method
  - requires storing initial `:` attributes
  + `:each` already does that way: just stores initial element as template, untouched

## [x] If directive: #55 - dispose or not elements from not matching branch? -> let's try el[_off]

  1. Keep alive

    - keeping hidden alive is heavy for perf
    - unexpected code gets executed
    - non-intuitive to js logic: `if (x) x.x` is valid in js, but in sprae `<x :if="x"><t :text="x.x"></t></x>` still triggers

  2. Dispose (turn off) / reinit

    - `<:if><x :each="a in b"/></>` - we don't dispose/reinit internal :each, :if attributes properly
      ~ needs a separate disposer?
    - dispose/reinit is presumably worse for performance
    - if there's `:if` inside of `:if`, it also needs to be disposed/reinited
      - that may cause conflict if element is part of considition chain, like `:else :if`
    - it's broken now already: if we dispose :if, we cannot reinit it nicely, since it loses connection with :else

  3. Stop / resubscribe effects only, not full dispose.

    + that's what we need: only disabling effects, not tackling nodes
    + we need something like _stop / _start or _dispose returning _start
    * instead of _on and _off funcs we can store all ons (effect fns) and offs(disposers) on element
      - we'd force :if to run el[_fx].map(f=>effect(f))
      - with storing _ons, _offs functions that'd be too memory-heavy
    * so we store el[_on] and el[_off] that enables/disables all effects

  4. Do clone in :if?

    - :ref loses element, which isn't natural nor matches spirit of WYSIWYG
    - not nice not to dispose properly

## [x] Autoinit missing values: #53 -> ensure first part of path exists

  + links to `:ref` accepting path instead of function.
  * How would that work?

  1. `if (expr in state) fn; else state[expr] = el`; `if !(expr in state) state[expr]=null`
    + the shortest
    + covers most basic case
    - doesn't support `:ref="x.y[z]"`, `:value="x.y[z]"`
  2. `getter(expr)(state) ?`, `setter(expr)(state, value)`
    - `setter` doesn't work: `with (state) {a=1}` sets to the global
  3. dlv
    -~ `dlv(o, k, def, p, undef) { k = k.split ? k.split('.') : k; for (p = 0; p < k.length; p++) { o = o ? o[k[p]] : undef; } return o === undef ? def : o; }`
    - doesn't support `x[y]`
  * We cannot force `x.y.z` to exist (for `state[expr]||=true`)
  4. `parse('arguments[0].'+expr)`
    + works?
    - not going to work with justin
  4.1 `parse('___.'+expr)` (standard state name)
    - still not going to work, since justing evals state access on its own
  5. `parse(expr+'||=null')(state)`
    + proofs props
    - no way to do `with (data) {}`
  6. `state[expr.split(/.\[/)[0])]` - we make sure first element exists
    + doesn't require heavy eval

## [x] s-attr? -> low-hanging fruit, why not
  * JSX doesn't support `:`-attributes.
  + JSX compatible
  + Seems to be the minimal spot https://grok.com/share/bGVnYWN5_bf6ecc59-1e28-43bf-983d-5422a956764b
  - not clear how to make `onfocus..onblur`, `:id:name`
    ~ mb skip it?
    ~+ `s-id:name` is available
  + it's low hanging fruit

## [x] :init? For autoinit elements -> no, use autoinit but keep data from `:scope`

  + makes init property on par with other sprae properties
  + can init multiple entry points in document
  - forces-sh autoinit (a matter of `querySelectorAll(':init')`)
    ~ not a big deal
  + it's more useful for JSX, since components will be initialized separately as `<div s-init="...data"></div>`
  + that's on-par with alpine
  * we can actually have `sprae.auto` or `sprae.jsx` entries that autoinit sprae.
    + that can predefine `s-` prefix
  - that's same as `:with`
  - `init` reads JSON, `:with` reads regular JS objects, they're not same

## [x] Autoinit - how? inert? sprae? init? -> wait until first request to not autoinit -> autoinit UMD by default -> ~~`data-sprae-start`~~ `data-start` / `start` attribute

  * TS doesn't allow arbitrary attributes on `<Script>` tag, but prefix (surprise!) is allowed.

  0. Do we ever need UMD without autosprae?
    + alpine autoinits, it doesn't wait

  1. sprae.auto.js
    - redundancy of entry - essentially just UMD with auto flag

  2. `<script init>`
    + petit-vue way
    - TS errors on that attribute

  3. `<script inert>`
    + resolves nextjs issue
    + we are unlikely to use that anyways
    - grok advices against it

  4. `<script data-sprae-init data-sprae-prefix="js-">`
    + standard way
    + allows other props
    - verbose
    - doesn't use prefix

  5. Autoinit until first request.
    + ESM entry is best alternative for such case

## [x] What's the best place for `untracked` to prevent faux root subscription in :with > :ref? -> best way to init outside of parent effect

  1. Whole sprae
    - overkill-ish
  2. Inside of :with

  3. Each pre-eval call, :ref, :value
    - doesn't generally save the issue

  4. Outside of parent effect:
    + effect can be async, so it must not cause async init

## [x] Immediate state access #58 -> pre-create store

  1. Async effects init
    + Allows referring to newly created state from inside methods
    + Errors in effects in first run don't break sprae
      - we still brand errors
    + Possible batch update
    + Possible await in effects
    - First blank frame
    - delay in init
    - all other frameworks are sync
    - grok conclusion is no https://grok.com/share/bGVnYWN5_8d145672-9faf-4df9-8b5a-9f190ac7e58f
      - size bloat, not sprae philosophy, existing alternatives

  2. `x.async` prop modifier
    - whole syntax conceptual space
    + we already do `parts`
    + it's `async func` directly

  3. `sprae.async` flag
    - unmade decision

  4. `async.sprae` flavor
    - not sufficient for a separate flavor
    ~+ unless we make batch, async effects

  5. Just export `sprae.store`

## [x] Should we separate `k,v in b` to `k in b`, `v of b` -> no. Use v,k in b, as all other frameworks do

  + likely perf optimizatino
  + same as in JS
  + we rarely need both key and value
  + possibly less issue with store
  + it's hard to remember if it's k,v or v,k
  - contrary to all-frameworks convention
  - js should've had it
  - it's called `each`, not `for`

### [x] ALT: keep only `k in b` -> no

  + will simplify state management: k doesn't change, unlike item
  + if you want separate scope - just create via `:with.item="items[i]"`
    ? can we make `:let="item=items[i]"` instead of `:with`?

## [x] Should we make all directives accept function? `:x="()=>{}"` -> yes, makes sense for tapping prev value, like :ref

  + #60 and others, sort-of natural expectation
  + solves the issue with flat events: we can write it without event right away, if event is not needed
    * `:onclick="a+1"`
  + we already sort-of do that in `:ref` - value writes to state, func taps into element
  + that would allow access to previous value
    * `:text="prev => !prev ? start : prev+1"` in counter
    * `:text.throttle-500="v => v + '-'"` for progress bar
      ~+ there's no easy way to do that via state but create a scope with manual setInterval
    + acts as reducer
  + works well with prop modifiers
    + that would unify prop modifiers with event modifiers
  - code redundancy, syntax complexity
  +~ allows calling methods with different params, like `next="x=>goto(p+1)"`, `prev="p=>goto(p-1)"`
    ~ not sure if that's good example
  + react setState allows function
  + it's more like inserting computed property
  + easier switch between branches `:style="() => a ? {...a} : {...b}"`
    - can do the same flat
  + timer is as easy as `:text.interval-1000="prev => (prev ??= 0, prev + 1)"`
  + we can for style actually pass el.style object instead, possibly with .computed property
  - incoherent signature
    - sometimes it takes prev value and updates with returned value `:text="prev => newValue"`
    - sometimes it takes native object and updates it, ignoring return `:style="style => style.x = 123"`
      ~+ we can make arg immutable, `obj` for style, `str` for class.
    - `:fx="a => b => c"` vs `:fx="..., b => c"`
    - `:ref="el => (mount, () => unmount)"`
    - `:ona..onb="..., b => c"`

## [x] How to detect function vs direct code `:x="x=>x"` vs `:x=x`? -> let's just try invoking the result if that's a function

  - generally mixing things up like that is generally a mess (sorry vue, that's f*d up)

  0. If effect returns a function, we call that function (continuation of normal effect flow) that's it.
    * We can create a subeffect for returned function
    + that makes events both inline or by-method
    + that enables other effects to be functions
    ~- that screws up fx cleanup, since it becomes `:fx="() => () => cleanup()"`
      - `:fx` doesn't have argument, so we enforce fn without a good reason

  1. Make all directives via events
    + unified code
    - `:onx` event vs `:x` property becomes the same, not different
      -~ `:click` and `:onclick` are potentially different things
      +~ but they never intersect in HTML, besides spread is there for that
    - possibly a bit heavier - triggering events for props
    + allows subscribing directly to props change, like `onstyle`, `onclass`, `ontext`, `onif`!, `oneach` - useful!
      + `.emit` modifier for that purpose

  2. `:on`, `@` for events, `:` for else
    - `:` props has code that detects a function, same as event
    + `@` allows binding multiple events to props change

  3. detect statically
    - doesn't detect property from state `:x="xEffectFn"`
    + allows unified way to pre-parse expr, as `:each` does

## [x] Should directives return `dispose` (instead of forcing effect `update` loop)? -> no, we need to on/off effects, so we need update fn
  + generally speaking directives don't have to follow single-effect update schema
    + eg. events don't need to react to every effect change
    + scope, fx doesn't have a return
    + directives can be async, interval etc - they generally define behavior
    - we decide async logic my modifiers, not arbitrarily by effects. Effects are supposed to be direct sync call.
  - takes more space
  - we should have control over disabling / re-enabling effects (on/off), so we need update fn as well
  - we control evaluation via standard mods, so we need update

## [x] Should we have a separate event handler/prefix like `@`, or that's just a kind of directive? -> no, let's keep : and alpine entry separate

  + allows easier alpine, vue entries
  + allows cleaner `sprae` code
  - performs extra check per-attribute
  - way more lengthy to implement and support
  - indecisiveness

## [x] Should we register full name of directive `:x`? -> no, let's keep things simple
  - No way to customize prefix
    - Complicates JSX entry
  - No much perf profit if not less

## [x] Flat directives.js instead of directives/ -> yes

  + simpler code, less weight
  + we need to _finish_ project, not continue, so we must not leave "extension" capabilities as much
  + copy-paste for custom bundle
  + directives are interconnected

## [x] Should we make :* any attr part of core? -> no, let's add on*, * wildcards instead
  + allows special arg (name) case not needed for other attribs
  + allows better separation of events directive (no need for condition)
  - probibits no-any bundles
    + vue, alpine ship default-fallback `:*` always anyways

## [x] Should :scope wait for modifier? -> yes: we may need to postpone execution
  * debounce, throttle, tick, async, raf, idle
  + natural way to postpone init of a subtree, eg. waiting for API response
  + standard way to provide `el[_state] = null`

## [x] Does it make sense to have chain/sequence for any attrs, as :foo..bar? What would be the cases? -> no, can't see a single use case

  - bloats up core a bit
    + shorter code in total
  - looks useless, no clear idea what for
  + reduces load from events handler
  + makes generic altering attrs
  - `:text..text="() => () => 'b'"` - is returned value a text or a function for next effect?
    ~ `:text..text..text="count, ['a','b','c']"`
      ~ same as `:text="['a','b','c'][count%3]"`
  ? `:class..style`
  + if we convert all effects to events, then we'll have unified handling `:ontext..ontext`
    + `:click` will be same as `:onclick`
  ~ We can do `sprae.init` that handles kinds of syntax.
  * It seems to be useful for only effect directives without returning value, eg.
    * `:fx..fx="() => {a=1, () => {}}"`
  * Take plugins in consideration?
    * `:intersect..intersect=""`

## [x] `:ona:onb..onc:ond` -> `:ona:onb .. :onc:ond`
  + this allows binding multiple cross-related events

## [x] Should we convert directives like :text to events and subscribe to them? -> no, events have no effects
  - slower
  + unified code handling for events / modifiers
    - not really
  + no need for `.emit` modifier
    + which saves args passing to mods as well - its code wouldn't be obvious
  - events are separate branch, they don't depend on effects

## [x] Delayed effects: how do we subscribe to out-of-context debounced calls? -> we should have _change signal and trigger effect only by it

  * https://grok.com/share/bGVnYWN5_dc406b06-2dca-470a-9931-7dc4ef83b4a6
  1. Init call is immediate, all subsequent calls are scheduled
    - scheduled calls still lose the context
    - it schedules multiple calls for multiple changes, instead it should batch
  2. Modifiers belong to store: it collects all changes until the next "commit", which triggers all async signals
    ~ we have to decouple signal writes from secondary effect calls
    * so it must be self-calling effect, but it must check if it comes from direct prop change it should just schedule itself and recall in proper scheduled way
  2.1 Trigger effects only coming from events
    * We can check if first argument in effect is event, then we trigger it, otherwise we dispatch an event (or schedule)
    + solves the issue above
    + covers .emit out of the box
    - by the time of second (deferred) call we have to run effect in the same (initial) context.
      ~ for that we need to have a special "authorized" signal that will trigger the effect, not regular signals
      ~ it will be similar to 2. - we'll have "staged" state and "commit" state.
      ? how do we find out that the effect was triggered by _commit/_change signal?
  2.2 We run effect only by _change signal.
    * That signal is set only through scheduler.
    * Every effect has its own `_change` signal.
  3. ~~We wrap async call into same effect~~
    - it doesn't deduplicate, second function is subscribed along with the first one
  4. Attribute controller
    + Can be simplified in microsprae: sync, no modifiers

### [x] Should we apply .tick ~~and .emit~~ automatically? -> unavoidable to prevent cycle

  + less API
  + automatic batching
  + events out of box, used for effects
  + unavoidable to prevent loop
  - tick is not necessary
  - makes updates slightly heavier
  - .emit manually can be default prevented to skip update, so no use

### [x] Conditional queries: md:onclick, lg:onclick etc? -> .screen-<size> plugin

  + tailwind-like
  + can be handy I suppose

## [x] Attributes/events mixup. Do we need prop modifiers? -> no

  - Attributes are called when internal prop changes, events are called by external trigger.
    - There's no indicator of that difference
  - That affects modifiers: it is also mixed up now - it applies differently to prop or event
  - Some modifiers can actually be events, like :raf, :idle, :interval, :once === :init
  ? What is the main case we need modifiers for regular props?

### [x] Do we need direct events like :click without :on prefix? -> keep only :on

  + Shorter
  + Technically no intersection for default events
  - custom events can interfere with props
  - some props might have same name as standard event

## [x] :else :if doesn't completely off itself when not matched -> done as centralized handler
  * `:else :if` lazy-inits `:if` by `:else` on the component itself, adding own destructor to the own list of offs.
    - by that when the `:if` condition not matches it destroys itself, causing losing signal propagation chain.
  * how to avoid that?
  1. Move `:else :if` logic into `:else`?
    - nope, it doesn't help much - `:else` still lazy-spraes on element itself, since `:if` is still present after `:else`
  2. Initialize `:else :if` in a single run at once.
    - but `:if` may have own mods making it async
    - also it might be `:else:if=""`, which is handled by initDirective
  3. Can we find `:if` somehow during `:else` and init via `initDirective` (whatever it's called)?
    + It would create only single `off` for `:else :if` element
    ? how to find it, since it might have modifiers?
  * We need only one destructor in `:else :if` element _or_ both destructor belonging to the root _or_ exclude own destructor from turning off
  * We may think `:else` should handle `:else :if`
    * But then `:if` from `:else :if` should somehow update _match state to propagate change, which subjects it being offable
  4. Can we for lazy-init pass parent where to add destructors?
    - We still need to be able to turn off all other events etc on the element
  5. Can we try to make fake-else, so that it is ok to be _off'd?
    + The update function returned by else is anyways called only by `_prev?._match.value`
    * We come to dilemma: should `:else` stop and lazify further init by condition, or it should let subsequent `:if` to initialize to decide
      * If we stop, then we cannot init `:if`
      * If we continue, then we initialize only-`:else` even when condition is not matched

## [x] Prop modifiers -> makes sense for :text.once, :text.interval-<n>, :value.tick, :value.throttle-100, :value.persist, :style.raf,

  * Main variants
  * ~~value.bind? value.watch?~~ no sense beyound value/ref
  * ~~prop.reflect, prop.observe~~ signals are autoobserved
  * ~~prop.boolean, .number, .string, .array, .object~~ defined per-property
  * prop.once
    + actually it's existing event modifier
    - can be replaced with :init
      + can be more useful than :init since can specify the directive
      + :oninit is custom event, not fit into sprae semantic space
  * ~~prop.change - run only if value changes~~
    - seems like unnecessary manual optimization that must be done always automatically
    - some values don't change, like class or style
    ? are there cases where force-update is necessary?
  * prop.throttle-xxx, prop.debounce-xxx
    - let's wait until that's really a problem
    + can be useful for :value='' to prevent frequent updates
  * ~~prop.interval-500~~
    + `:fx.interval-500="el.scrollLeft += 10"`
    - can be a custom event instead
      + value param for event name is not natural
    - not natural for props to be triggered this way
    - can be done as `:fx.once="setInterval(()=>...,1000)"`
  * prop.* – multiple values for same prop
  * prop.tick="" - run update after other DOM updates happen
    + helps resolving calling a fn with state access
  * ~~prop.fx="" - run effect without changing property~~ fx is there
  * ~~x.prop="xyz" - set element property, rather than attribute (following topic)~~ do it via `:ref` or `:fx`
  * x.raf="abc" - ~~run regularly?~~ throttle updates
    + can be useful for live anim effects
  * ~~x.watch-a-b-c - update by change of any of the deps~~
  * :x.any - update by _any_ state change
  * :x.persist="v"
    - solvable via nadis - persisted signal
    - doesn't match with all directives, mainly only :value
      ? a special directive, like `:presisted-value`?
  * :x.lazy?
  * :x.memo?
  * :x.trim?
  * :x.screen-md=""

  ~ so props have to do with describing how effect is triggered.
  + It seems event modifiers can be applied to any props: interval, debounce,
  + it allows factoring them out
  - it brings us to a tough spot where we deal with asynchronous conditional, which is hard and fragile.

## [x] Modifiers: remove dash parameter and use dot notation instead? -> likely no, too cluttery

  + Enables `debounce.tick`, `debounce.frame`, `debounce.100`, `debounde.idle`
  + Coherent with `.stop.immediate`
  + Coherent with directive names: dash is used for name, not parameter
    + We don't use dashes there
  + Coherent with alpine
  + Removes variety of modifiers
  - parsing is complicated - it reverses the order of functions
  - now it's possible to `.ctrl-a` for example. `.ctrl.a.b` is wrong and ugly.

## [x] Autoinit via mutation observer? -> let's try, seems ok

  + runs until document is loaded
  + immediately inits all new nodes, opposed to displaying half-baked content
  + alpine keeps MO for entire document lifecycle
  * suppose sprae doesn't create elements outside of own scope, so we don't need to observe spraed nodes
    * it fully controls the subtree in other words
  * therefore we need to observe the root, since new spraeable nodes can appear anywhere
  * the question is what's spraing strategy to exclude spraeable els from MO triggering

  1. Sprae top root
    - one-time long iterating
    + MO is attached after sprae, which excludes :each and other triggers of MO
    + easier to turn off/on the whole thing
    * any new nodes with spraeable attribs means it's outside of current sprae scope, need to be handled with scope of the root (`initElement`)
  2. Sprae sub roots
    - collecting subroots cost
      - not a fact it's faster than one-time iteration
  3. Sprae elements with spraeable attributes

## [x] Observing .length strategy -> override mutator methods, there's no other reliable way

  1. Detect mutator method, count .length access
    + it seems mutators follow the pattern reading .length and then setting length
    - might be not very reliable
    - `x.push(x.length = x.length + x.length)` - hard to argue when's `.push -> .length` reading vs outside reading
      - it must be still subscribable by reading `x.length` inside of `push(x.length)` - so we have no choice but set flag on the moment of call
  2. Wrap mutator methods
    + reliable
    - heavier code
    -~ possible conflicts
    - likely slower

## [x] Isolate effects contexts/scopes
  * Imagine a situation when `<x :onx="list.push(123)"/><y :text="list.length"/>`
    * whenever we do `onx` it updates list.length in the same tick
    * in other words tight coupling, `list.push` includes update of `y:text`
  * We would want for these contexts to be independent. How?
  * It should init synchronously, but updaing effects via debounce.
    + that would allow batching organically.
    + that would solve preact issue
    + we can make sync version for microsprae.
  * For now just skip only one .length read in mutators

### [ ] Should we maintain directives attributes on elements instead of removing them?

  + allows easier resprae of element
    + non-invasive
  + easier DOM debugging
  + allows disposing on element removal and reinit on adding back
  - dirtier DOM
    - not evaporating
  + that would allow `sprae.stop()` counterpart to `sprae.start()`
  + alpine flavor would need it

## [x] ~~.debounce-tick becomes .tick, .debounce-frame becomes .raf~~ -> `-0` === `-tick`

  + `.debounce-tick` is too lengthy and non-intuitive, not cool
  + can get deprecated with fallback to debounce-0
  + .tick can be debounced right away, we never need first call and there never can be in-between (no need to cancel)
  + .raf never needs to be debounced, it is always throttled cept first frame

  a. There's better option: `tick` becomes for value of 0
    + so it disappears;
    + `raf` becomes alternative to a number
    + `.delay` is for another way of calling

## [x] Factor out events to directives -> yes

  + It should be able to be turned off
  + There's too much overkill going on for simple prop directives with that steps state machine
    + exceptional case (events) defines the whole parsing method
  * The nature of events is different, as was discussed before
    * It applies modifiers not as prop, but as event listener
  + Name aliases / chains are only applicable for `:<attr>` and `:on<event>`, doesn't make sense for other directives
    * We can try moving `name` attr, mods parsing, sequences parsing, events handling - to some "default" handler
      + which will free up space for microsprae
  - Moving out sequencing logic complicates single-event handler which we might want to connect
    + It means we keep sequencing in `dir`
  - We cannot use regular effect invokator, since callback doesn't need to subscribe to variables change

  * it feels like event can be a modifier `.event-<x>` which re-triggers a callback with arg
    ~ we would need to handle "cancel" by modifiers, which would also be the case for .interval
    - still will end up in calling invoke... we have to redefine invoke

### [x] Do we have to keep aliases on dir, or that's only last-resort _ directive feature? -> let's keep generic aliases, it's useful
  + `:text:title=""`, `:value:title=""`
  + `:text:href=""`
  ~ `:id:name` in case if `:id` is both defined as custom directive
  ~ `:placeholder`
  ~ `:text:aria-label`
  ~ `:text:data-tooltip`
  ~ `:text:lang`
  - overall no so much value as in events sequences/aliases `:onclick:onkeypress.document.arrow-down:onkeypress.document.key-s`
  * that seems to be `sprae` build feature, because we cannot complicate event directive with syntax parsing either

### [x] Where do we handle alias? -> dealias before `dir`
  1. In `dir`
    - perf/mem tax for all directives
    - even if we trim `..` tail, we pass only head-of-chain aliases, ignoring the tail
    - doesn't make sense cre
  2. In `_`
    - mixes concerns: it is supposed to be a router
      ~ aliases can be part of routing concern
    - recreates mods logic for aliases from `dir`
      ~ we can disregard props aliases, it seems there's very few use-cases
        - that's minor regression
  3. Per-directive
    + it's ok from DX point to have extended syntax for unnamed directives
    - heavier weight for `event` directive
      - no much sense for `micro.js`
    + handling logic in one place
    + `name` contains full string to handle any way we need
    + reinforces passing meaningful directives info to directives
      + empowers directives to deal with its internals
  4. Dealias before `dir`
    + reuses `dir` function
    - need to detect `..` or elsehow for valid dealias syntax

### [x] Where do we handle steps for chains (sequences)? -> separate directive
  1. In `event` directive
    + Makes chains specific syntax for events
    + Establishes pattern of empowering directives to handle custom syntax
  2. In dealiaser (framework-level), passing `next` as callback argument to switch directive to next
    + Generic sequencing logic
    + Allows any other directives to have sequences
    + Takes burden off micro.js, keeping event directive code minimal
    - We might not be able to define how to iterate through values - we don't need to evaluate always, only 0th element, and we should run last returned function
      - That flexibility of when to eval and what to run next makes directive tightly coupled with steps and is easier to be handled inside of directive

### [x] What other custom syntax might be available for directives? -> no much ideas
  * `class="active" :-class="{active}"` - remove class from static one
    ~- can be handled as `:class={active:null}`
  * `:text|uppercase="abc"`

## [x] Componentization: what can be done? -> likely no for now. When html-include / DCE is there we can talk

  1. define-element

    - templating uses django syntax - leads to verbatim conflict
      ~ we're not necessarily going to use django
    - `<template>` within `<template>` is not nice, for the case of :each etc
      ~ foreach works as `<template directive="foraeach" expression="...">xxx</template>`, so it shouldn't be a problem
    - no obvious way to import elements
      - requires some bundling, likely for HTML
    - non-standard

  2. JS custom elements

    + allows esm bundling of templates
    + allows evaluatig sprae manually
    + fine-grain control of attributes
    - requires innerHTML
    - direct competition with JSX, which is weird
    ~ we can make spraex extension for JSX to allow :on attributes

  3. No componentization

    + discipline of tiny single-purpose apps
    + factors componentization out to other libs
    - makes sprae less useful as dependency

  4. include / html / render

    + gives intermediate solution
    + classic
    - no components
    - a bit implicit

  5. htmx-like requests

  6. https://github.com/jhuddle/ponys
    + takes the toll of including, enabling, defining components in minimal way

  7. Parent -> child defining the behavior, like css or delegate does

## [x] Reasons against sprae ->

  - requires loading script anyways - not native event callbacks
    + 5kb is almost nothing
  - ~~no `this` keyword makes it a bit cumbersome~~
  -~ separate syntax space even with `:` prefix - conflicts
  - perf-wise vanilla is faster
    + more tedious
    + technically can be static-bundled
  - initial loading delay.
  - chatgpt is super easy to ask to generate basic code
    + ask about sprae

## [ ] Destructor option
  1. `el[_dispose]`
  2. `dispose(el)`
    + no pollution
    + more modern
    + similar to `use`, `start` etc
    + can be held as a pattern inside of directives `fx(...), cleanup(...)`

## [ ] Sprae static
  * Compiles away to plain html

## [ ] Directives

  * s-cloak? Hides contents until sprae finishes loading
    * wait until needed
    + provided by lucia l-mask, alpine a-cloak, vue v-cloak
    ~ can be handled automatically?

  * s-ignore? Excludes element from spraing
  * s-include / s-html?
  * s-teleport
  * s-modelable
  * s-init
    + instead of :fx.once. An event - oninit
  * s-raf
    + instead of :fx.raf. An event - onraf
  * s-interval
    + instead of :fx.interval. An event - oninterval
  * ~~s-show?~~ use hidden attribute

## [ ] Plugins

  * See https://github.com/alpinejs/alpine/tree/main/packages
  * @sprae/data, /item, /aria
  * @sprae/tw: `<x :tw="mt-1 mx-2"></x>` - separate tailwind utility classes from main ones; allow conditional setters.
  * @sprae/item: `<x :item="{type:a, scope:b}"` – provide microdata
    - can be solved naturally, unless there's special meaning
  * @sprae/hcodes: `<x :hcode=""` – provide microformats
  * @sprae/visible?
    - can be solved externally
    * cannot be a modifier: it's onvisible/oninvisible events
    + pluggable directive
  * @sprae/intersect
    + pluggable directive
  * @sprae/anchor
  * @sprae/collapse
  * @sprae/sort
  * @sprae/persists - mb for signals?
    + pluggable modifier
  * @sprae/scroll - `:scroll.view.x="progress => "`
  * @sprae/animate -
  * ~~@sprae/mount -~~
  * media - .screen-md
  * .interval-<tick|raf|number> - modifier for timers

## [ ] Integrations

  * Any personal SPA
  * Wavearea
  * Sprae website
  * SVG generators

## [ ] Example ideas

  * Hello world
  * Day/night switch
  ```html
    <script src="https://cdn.jsdelivr.net/npm/sprae@12.x.x" start></script>

    <div :scope="{ isDark: false }">
      <button :onclick="isDark = !isDark">
        <span :text="isDark ? '🌙' : '☀️'"></span>
      </button>
      <div :class="isDark ? 'dark' : 'light'">Welcome to Spræ!</div>
    </div>

    <style>
      .light { background: #fff; color: #000; }
      .dark { background: #333; color: #fff; }
    </style>
  ```
  * Namaste / Hello World
  * Japa counter
  * Animated scroll
  * Random palette for theme
  * Slider
  * Todo list
  ```html
    <div :state="{ value: '', todo: [] }">
      <input :value="value" />
      <button :onclick="todo.push(value)">Create</button>
      <ul :each="task in todo">
        <li :text="this.task">My Example Task</li>
      </ul>
    </div>
  ```
  * Status indicator on/off
  * Breathe in / out
  * Rotation animation
  * Progress animation
  * Marquee
  * Waveform indicator
  * Details like in alpine
  * Tabs (+ filters switch like in tw example)
  * Click to copy
  * Tooltip
  * Scroll animation
  * Motion adjustment
  * Autotype
  * Any plugins from jquery hoard et
  * 7GUIs https://eugenkiss.github.io/7guis/
  * forms
  * routing
  * animations

## [ ] Sketch/example UI randomization

  * Canonical.ui collection
  * Sketches in drops may have "archetypal" uis and l&f can be randomized/reskinned

## [x] FAQ

  * https://grok.com/share/bGVnYWN5_4fb0e9f5-af5f-44b2-97f6-6327b7b540d1
  ! compare implementation of all frameworks

## [ ] Website

  * refs: https://poolside.ai/, https://alpinejs.dev/
  * [ ] Intro: core philosophy, features, quick meaningful example, "Get started"
  * [ ] Why?: comparison, benefits (no build step, light, fast, SEO-friendly, no SSR needed), use-cases, testimonials, cases
  * [ ] Docs: installing, core concepts, directives, recipes (forms, routing, animations), best practices (tips for perf, debugging, maintaining)
  * [ ] Examples: todo, counter, dynamic form. Very common els
  * [ ] Showcase gallery?
  * [ ] Playground: share/download
  * [ ] Community: github, blog, tutorials, announcements
  * [ ] FAQ: What's PE? How sprae compares to <framework>? Can I use with other FW? Is it suitable for large scale?
  * [ ] Friends: related libs
  * [ ] Trust: contact, contributors, sponsor; built with: links
  * [ ] JS-framework-benchmark ref
  * [ ] Transition guide from alpine/petit
  * [ ] Sponsor development (of components)
    * [ ] paypal
    * [ ] stripe
    * [ ] bitcoin
    * [ ] gumroad

## [ ] Components / drops

  * [ ] Open UI
  * [ ] Tailwind components
  * [ ] Alpine components
  * [ ] Codrops
  * [ ] Jhay
  * [ ] Codepen

## [ ] Sprae vs Alpine

* Let's be honest, is ther a big difference with alpine?

Feature | Sprae | Alpine
---|---|---
JSX | via `prefix` | via `x-on:abc=""`?
Sandbox | Yes | No
Reactivity | Signals | Vue, internal
Scope transparency | Yes | Yes

Magic | No | Yes
Open controllable state | Yes | No
Size | 10kb | 15kb
Perf | Ok | Slow
CSP | Yes | Yes
Async | Yes | Yes
Const, let | Yes | Yes
Fragments | Yes | Yes

Ecosystem | No | Yes
Plugins | 0 | Many
Components | 0 | Many
