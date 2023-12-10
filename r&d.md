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

## [x] :with? -> let's use `:with="{x:1,y:2,z:3}"` for now

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
    - can be solved as `<x :if="xxx" :="xxx && (...)'">` automatically

## [ ] :onmount/onunmount? ->

  + useful for :if, :each
  + useful to dispose listeners via :onunmount (opposed to hidden symbols)
  - doesn't really solve disposal: if element is attached again, it would need to reattach removed listeners
    -> can be dolved via teardowns returned from updators
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
* @sprae/onvisible?
  - can be solved externally
* @sprae/onintersects

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
  + allows easier handle of `:with="a=1,b=2,c=3"` - we just naturally get local variables without messup with global
    + we can even define locals without `let`...
  - not having "comfy" compatible JS at hand: cognitive load of whole language "layer" in-between
    ~ `:each` is not js anyways
  + allows `let a = 1; a;` case instead of `let a = 1; return a;`
  - we can't identify dynamic parts like `x[y]`, whereas Proxy subscribe dynamically
    ~ we can detect dynamic parts and handle them on proxy
  + subscript allows subscriptions to async functions, unlike signals
  +? we can detect `array.length`, not sure what for

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

## [x] Store: strategies -> 3. seems the most balanced for now

1. Signals struct
  + fastest
  + limits access to not-existing props
  + seals object
  + no circular update trouble
  - doesn't handle arrays

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
  - store looks ugly, some proxies over signals objects

4. Subscript-based something

## [x] :each over/undersubscription -> proxy-signals store solves that

* we must subscribe to each item from the list - it should update itself only, not the whole list. How?

1. Async reconciliation part - it plans list rerendering (loop part) in the next tick, and this tick may have as many item changes as needed

2. Individual effects per-item `fx(() => {updateItem(list[idx])})`
  * Can be created in advance, and list updates only cause effects changes

3. Nested effects: parent effects don't get subscribed in internal effects, so we just modify :each to create multiple internal effects per-item.
  + we might not need swapdom, since nodes manage themselves
  * note the untracked function


## [x] :onclick="direct code" ? -> no: immediately invoked.

  + compatible with direct `onclick=...`
  + no need for arrow/regular functions syntax in templates
    - still need that syntax for filters, maps etc
  + can be made async by default
  - illicit `event` object
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

## [x] Should we introduce `@click` for short-notation events? -> let's keep `:onx` for raw events, `@x` for normal events
  + gives shorter code for majority of cases
  + can be non-conflicting
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
  - introduces illicit `event` variable ~ although compatible with standard, still obscure
  - `@` prefix is unchangeable ~ can be removed, not set, but still on the verge.
  - `@click.toggle="code"` has same problem as `@a..@b` - how can we make code separation in attribute?
    + remove toggle
  + overall less code

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
    - it doesn't help with switch-over
  ? Some 'or' character `:onclick--onkeydown`
  ? We can redirect to main event, that's it for now

## [x] Should getters convert to computed? -> yes, that's relatively cheap and useful

  + shorter and nicer syntax
  - possibly longer init

## [ ] Better :ref

  + :ref="`a-${1}`"
  + :id:ref="xyz"
    - `:id` is string, `:ref` is var name
  ? maybe id should have same signature
  ? should it be very similar mechanism to `:with="a=1,b=2"`
  ~ ref must be possible as `:fx="x=this"`

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

## [ ] Prop modifiers

  - overall seems code complication without much benefit
  * [ ] :value.bind? :value.watch?
    - let's wait for use-case: value can be too big to set it every time
  * [ ] :prop.reflect, :prop.observe
    - let's wait for use-case
  * [ ] :prop.boolean, .number, .string, .array, .object
    - let's wait for use-case
  * [ ] :prop.once, :prop.fx ? :prop.init?
    - doesn't seem required, let's wait for use case
  * [ ] :prop.change - run only if value changes
    - seems like unnecessary manual optimization that must be done always automatically
    ? are there cases where force-update is necessary?
  * [ ] :prop.throttle-xxx, :prop.debounce-xxx
    - let's wait until that's really a problem
  * [ ] :prop.class
    ? what's the use-case
  * [ ] :prop.next="" - run update after other DOM updates happen
  * [ ] :prop.fx="" - run effect without changing property
  * [ ] :x.prop="xyz" - set element property, rather than attribute (following topic)
  * [ ] :x.raf="abc" - run regularly?
  * [ ] :x.watch-a-b-c - update by change of any of the deps
  * [ ] :x.always - update by _any_ dep change
  * [ ] :class.active="active"
  * [ ] :x.persist="v"

## [x] Writing props on elements (like ones in :each) -> nah, just use `:x="this.x=abc"`

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

## [x] Insert content by reusing the node/template -> use `:render="ref" :with="data"`

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

## [x] Remove non-essential directives -> yep, less API friction
  * :aria - can be defined via plain attributes
  * :data - confusable with :scope, doesn't provide much value, can be used as `:data-x=""` etc
  * :={} - what's the meaning? Can be replaced with multiple attributes, no? No: no easy way to spread attributes.

## [x] let/const in expressions: allow or prohibit -> let's prohibit, force user to wrap into a function himself

  - allowing forces wrapping internally, which creates return statement confustion

## [x] Take over parent signals, rather than inherit?

  - Parent state can dynamically obtain new signal, and nested states won't have access to that

## [x] Ditch proxy-store in favor of preact/signals -> let's try

  + way less size
  + way easier internal logic/debugging
  + reactive values are explicitly kept
  + no duplication
  + state update can be done in proper batch-way `sprae(el, obj)`
  + sprae can return `dispose` function directly
  + better performance / memory metrics
  + simpler API: there's no notion of state
  - no Sandbox
    ~ it's sifting anyways
  ~+ we can split up state into something separate

## [x] ? is there a way to use it without preact/signals dependency? -> seems too complicated and implicit
  + would be nice, since sube doesn't require disposal, unlike preact/signals
    - not really: signal.subscribe needs subsequent unsubscribe
    * so there's really little chance to avoid disposals
  + it gives less unexpected / accidental subscriptions / cycles, since subscribable value is explicit
    - it
  - :class="`${a.value}` ${b.value}"
    ~ suppose we limit subscription to only output object as :class="[a, b]"
  - :text="a.value + b.value"
    ~ it would need to become calculated property `aText=computed(()=>a.value+b.value)`, `:text="aText"`
  + there's less point of holding autosprae
  - :disabled="!name" - too much hassle to create computed prop, no?

### [ ] What's possible best way to indicate dependencies (w/o signals)
  ? :disabled~name="!name"
    - not valid attribute
  ? :disabled.-name
    - messes up prop modifiers
  ? :disabled.watch-name="!name"
    - too long, also excludes names with dashes
  ? :disabled--name="!name"
    + not conflicting with prop modifiers
    + unique syntax space
    * :text--a--b="`${a} ${b}`"
    * :class--a--b="[a, b]"
    + gives reference to CSS variables starting with --, but here it's prop variables
    - :style--caretY--caretX--cols can be out of context and too long
  ? :disabled="!var(name)", :disabled=
  ? substitute signal values with {valueOf} wrappers that register deps?
    - too heavy
  ? subscript
    - heavy
    ~ doesn't parse dynamic parts
  ? regex-parse all ids and match against provided values
    + fastest
    + simplest
    - doesn't parse dynamic prop access
      ~? maybe we don't need it, do we?
      ~ myabe it's better to keep them untouched to avoid oversubscription
    -~ not obvious which items are subscribable which are not
