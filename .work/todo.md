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
* [x] ~~Avoid creating signals for static values~~ -> v9 avoids that
* [x] ~~Figure out `arr.push()` - do we need to ever have calls as signals?~~

### [x] v9

* [x] subscript-based eval
  * [x] make `a in b` via subscript
* [x] no store
* [x] switching signals
* [x] get rid of `@` events
* [x] plugins: extensible directives
* [x] comparison table: CSP, plugins, no-deps, size, performance, event/modifiers,
* [~] add :html directive as replacement for :render, with tests
* [x] rename :with to :scope
* [x] :fx=fx
* [x] make signals tests (nested effects)
* [x] try direct directives without primary/secondary
* [x] split directives
* [x] switchable compiler
* [x] clear exports (no parse, err) - make sense of `compile` function as exported
* [x] template test (:text, :html, :if, :each)
* [x] fx teardown
* [x] flatten API, API to docs: `./core` (custom build), `./sprae` (default entry)
  * [x] make CSP a docs config, not entry
* [x] customizable swapper
* [x] ~~`sprae.*` instead of `.use`, extending docs: directive, compile, swap, signals~~ `.use` is more compact
  * [x] ~~no-signals (signals are pluggable): better teardown flow; returns dispose fn, not state; pluggable ulive; signals from original source, not sprae~~ can't avoid effect, the codebase is tiny
* [x] ~~0-code sandbox (stub props)~~ - unnecessary `Object.create`
* [x] interpolatable strings
* [x] :each that keeps elements
* [x] Plugins
  * [x] :aria
  * [x] :data
  * [x] ~~:item~~
* [x] move effect out of directives, make signal-less state (ideally).
* [x] fix ToDo
* [x] all FIXMEs
* [x] ~~make cross-version testing: sprae, csp, signals variations~~ justin default is enough
* [x] avoid triggering unchanged effects
* [x] ~~since we use justin - make templates reactive~~ nah, too much friction
* [x] ~~replace class="∴" with just "∴" attribute (less interference/friction)~~ invalid attribute
* [x] collapse dirs into details
* [x] make item itself a key also
* [x] ~~move proxy state into own project / part of signal struct (with tests from here)~~ part of sprae is better
* [x] some bug with keys identity in todo
* [x] v9 issues:
  * [x] creating/releasing rows doesn't clear up memory
    * because weakmap stores by key, only if key is disposed it clears up
  * [x] replacing/swapping rows is slow
    * the reason of slowdown is key - sometimes it's better to keep index as key, not id
* [x] ~~state as signal: test updates itself `sprae(el, signal({x:1}))` - needed for :each loop~~
* [x] switchable compiler
* [x] ~~try getting rid of compile() calls in subscript~~ not sprae's concern
* [x] try getting rid of compile() calls in sprae
  ? how to parse each, ref expression?
    -> via redefining .parse

## [x] v10

* [x] signals based on signals proposal
* [x] proxy state is back
  * [x] try out store without `values` holder
  * [x] flatten `store` to avoid passing parent (only needed by `scope`)
  * [x] bring `effect` back to all directives
  * [x] make array push updates batched
* [x] remove valueOf()s in directives
* [x] separate store to object / array
* [x] ~~finish all .todo tests~~ they're not relevant
* [x] make :with create static state
* [x] ~~make :ref recognize strings/evaluables~~ no need, wait until needed, simpler the better, even effect is not needed
* [x] with must not create inherited root scope, it's enough to overwrite signals
  * [x] this also allows removing signals argument from store
* [x] run benchmarks
* [x] :each is too slow for appending 1000 items
* [x] make each scope flat computed, not inheritance
* [x] fix todo mvc
  * [x] `todos.filter(xxx).length` - should be subscribable
  * [x] test `item = {...item}`
* [x] ~~try debouncing / batching array.length writes~~ doesn't seem possible
* [x] lodash for untracked values
* [x] fix wavearea
* [x] fix :if within :each
* [x] make functional ref
* [x] add hint about :html
* [x] make v11 release
* [x] make :ref accept path
* [x] fix #55 - ifs omitment
* [x] get rid of dir.parse in favor of smth better
* [x] remove ~~computed~~, batch, untracked -> simplify
* [x] fix plain update bug #55
* [x] js-framework-bench push + example
* [ ] add test for jsperf adding multiple elements - make sure it's O(n), not n**2
  * [ ] maybe just add jsperf bench as tests
* [x] ~~immediate scope~~ -> :scope
* [x] ref doesnt add to with -> it forces null init
* [x] test: create store separately case
* [x] test: new prop/signal added to root store: substore doesn't have it
* [x] test: one effect error (like wrong syntax) should not break all subsequent effects
* [x] test: two refs with same name, like `list`.
* [x] sandbox property for store

## [x] v12

* [x] Don't do unnecessary customization like on*, *. Just do minimal workable bundle.
* [x] generalize prop modifiers
* [x] make dirs accept functions
* [x] separate events from props
* [x] enable async effect and run all basic tests
* [x] v11 nested each bug (github)
* [x] :else :if offing -> keep this side-effect of not turning off :else-ifs for now
  * [x] ? why doesn't :if turn off itself when _off is called? -> because :if destructor (off) is added to the root element, and :if itself has own _offs_
    * The issue here is when we init `:else :if`, it happens on the same component, therefore `:if` is added to existing _offs_, not the root one.
* [x] :if preact issue: it has screwed up order of effect callbacks & :else should be able to have mods
* [x] disable prop modifiers shortcut and test all effects
* [x] modularize
* [x] ~~flavors: alpine, vue, micro, secure~~
* [x] switch signals to preact and test everything
* [x] flat directives
* [x] get rid of :data, :aria
* [x] run effects after collecting them
* [x] :scope instead of :with
* [x] simplify nested store: just object inheritance
* [x] pass globals to store
* [x] expose sprae.compile, .prefix, .dir
* [x] make :each use inheritance instead of Proxy
* [x] `:value` tests
* [x] move modifiers to sprae.js
* [x] event extra modifiers tests
* [x] prop modifiers tests
* [x] async callbacks tests
* [x] Better autoinit: mutation observer until page loads?
* [x] test: finish ajamila poll with v12
* [x] something is off with updating condition based on list length
* [x] make dir/mod separate objects, outside of use
[x] Jessie limitations
  * [x] `await` keyword: `let v = await fetch()` - jessie doesn't support await (use `async () => Promise.then()`)
  * [x] `this` binding: `this.x`, `log.push(this)` - jessie doesn't preserve `this` context
  * [x] Function directives with state access: `:text="t => t + s"` - FIXED via receiver check in store.js
  * [x] `Array.from({length: x}, ...)` with reactive x - FIXED via receiver check in store.js
* [x] async functions... alpine does it well
* [x] if, let, const, semicolon syntax allowance
* [x] All TODO/FIXME address
* [x] Nextjs data-sprae-start defaults to true, which is invalid selector
  * [x] Likely we may want multiple els to init as well
* [x] data-sprae-prefix="data-sprae-" shoots itself
* [x] refactor main demos
* [x] Draft release
* [x] jsperf benchmark
* [x] ~~core test runner: signals variants, normal/micro, sync/async, module/bundle~~
* [x] Optimizations (https://krausest.github.io/js-framework-benchmark/current.html)
  * [x] Append rows to large table is THE SLOWEST
  * [~] Create many rows IS SLOW
* [x] expose `this` - not a big deal
* [x] `.tick` alias, `.raf` alias - debounce + throttle
* [x] ~~mobile click is super sluggish~~ not anymore. Is that tailwind?
* [x] make :on a directive, not hardcoded
* [x] add .delay
* [x] .stop-immediate
* [x] global calls like getComputedStyle fail without window.
* [x] ~~make :scope init untracked~~ -> use :scope.once
* [x] test .outside - it doesn't work now
* [x] ~~`:scope="duration=false"` overrides parent duration (leaks scope variable)~~
* [x] `:ref="refs.el"`
* [x] `:onclick="//..."` inline comments
* [x] passing dates, regexps, instances of classes to state: should not wrap or serialize, keep as is
* [x] ~~`Ctrl+[`, `Ctrl+]` or `Ctrl+\` is unclear~~ do via char code
  * [x] `.capture.ctrl` - should be able to be called only on single modifier
  * [x] `.capture.ctrl-specific.prevent` - find a way to attach handlers for specific keys
  * [x] expose debounce, throttle etc - for manual use?
* [x] **typescript**: add .d.ts definitions — table stakes for modern JS
* [x] split deps: store, signal (sprae/store, sprae/signal)
* [x] **error handling**: element context in errors, async error handling, graceful propagation
* [-] ~~immediate scope `{lines:0, measure(){lines=count()}}`~~ not feasible
* [x] perf tests (memory/js-framework-bench) against alpine, vue — publish results
* [x] `sprae.disable(el)` for cleanup
* [x] ~~disable observer for DOM mutations (opt-in)~~ not feasible
* [x] alpine CSP syntax compatibility (jessie supports all Alpine CSP syntax + more: arrow functions, nested property writes, control flow)

* [x] ~~possibly `sprae.directive(name, fn)` instead of assigning~~ current object assignment is simpler, idiomatic JS
* [x] ~~possibly `:each="x,y in cols, rows"` for 2D iteration~~ rare case, nested :each works, ambiguous semantics, YAGNI
* [x] ~~swap directive update return as final disposer~~ current is cleaner: directives return pure updaters, `dir()` handles reactive plumbing
* [x] ~~`fx()` in directives instead of return~~ couples directives to effect impl, loses functional purity, harder to test

* [x] .throttle-idle
* [x] .throttle-100ms, .throttle-1s: parse-duration units
* [x] ~~.before-n, .after-n, .defer~~ not useful as much
* [x] ~~.throttle-immediate~~, .debounce-immediate
* [x] ~~:ref="el => {dep}" should re-trigger on dep changes?~~ will blur distinction
* [x] **alpine migration guide**: side-by-side syntax, why switch, what's different
* [x] **recipes section**: tabs, modal, dropdown, form validation, infinite scroll, accordion
* [x] **server components guide**: section in docs.md (Next.js, Astro, dynamic import pattern)
* [x] ~~**"why sprae" section**~~ readme comparison table already serves this purpose
* [x] ~~FAQ / troubleshooting section~~ already exists in index.html, docs.md has Hints for technical gotchas

* [x] **plugins system**: documented API for custom directives and modifiers in docs.md
* [x] ~~**devtools**~~ low priority, users can inspect state via console
* [x] ~~**signals proposal adapter**~~ already documented: signal-polyfill listed in Signals table with adapter link
* [x] ~~flavors: alpine (`x-`), vue (`v-`) compatibility layers~~ custom prefix already supported via `sprae.use({ prefix })`, not worth maintaining separate flavors
* [x] ~~community plugins directory~~ directives are 1-5 lines, docs teach the pattern instead


## [ ] Website
  * [x] **landing page overhaul**: values.md content → compelling index
  * [x] **Sprae vs Alpine** comparison page with benchmarks
  * [x] Write docs in readme; website should be small, readme - big, but small enough for docs.
  * [ ] **playground**: interactive editor like Alpine's
  * [ ] drops/examples gallery: 7 GUIs, real-world patterns
  * [ ] "Used by" section with logos
  * [ ] SEO: "alpine alternative", "lightweight vue", "reactive html"
  * [x] Display content from readme
  * [ ] Connect donation links
  * [x] Inverse color render
  * [x] Acronym rotator in header
  * [ ] Syntax highlighter
  * [x] index.md instead of index.html
  * [ ] Values section (see values.md)
    * [x] One-liners / taglines
    * [ ] Use cases grid
    * [x] Comparison table
    * [ ] Market position diagram
  * [x] Docs page UI
  * [ ] Playground (interactive editor)
  * [x] Sprae vs Alpine comparison page
  * [x] Drops page
    * [ ] UI randomizer
  * [ ] Examples
    * [x] 7 GUIs
    * [ ] Wavearea
    * [ ] Maetr
    * [ ] SVG confetti gen
    * [ ] SVG chat gen
    * [ ] SVG counter gen
  * [ ] Better reference examples
  * [ ] Icons for principles
  * [x] Subtle animations
  * [x] Better spraying interaction
  * [ ] Search
  * [ ] Bench page


## [x] Plugins (Stage 3 details)

* [x] ~~.before-n, .after-n, .defer (lodashes)~~ rare cases
* [x] ~~.interval~~ effects are reactive
* [x] ~~.persists~~ concern of nadi - signals collection
* [x] ~~.screen-md modifier for media~~ - conflate media and css
* [x] ~~:onvisible~~ - do via signal
* [x] ~~:aria~~ not needed
* [x] ~~:data~~
* [x] ~~:item~~
* [x] ~~:intersect~~ - recipes / userland
* [x] ~~:scroll.view.x="progress => "~~ not needed
* [x] :portal/teleport


## [ ] Trust & wedges (contemplation 2026-08-17)

Facts as of 2026-08-17: 190 stars, ~1.1k organic dl/wk (Aug 5-6 bot spike = 86% of monthly number), 0 sponsors,
drops shipped 2025-10 with no per-pattern URLs -> star velocity fell 4.66->2.61/mo (undistributed test, not a verdict on patterns),
dormant petite-vue still outsells 1.7x. Verdict: distribution before monetization; any paid thing is 50-250x traction away
and only ever sold to a distinct richer persona (CSP/extension shops), never "developers generally".

Trust patch:
* [x] one measured size number everywhere (11.6kb umd, was ~8kb badge / 10kb FAQ / 10.9kb compare) + test/size.js in prepublishOnly
* [x] csp.md size row was stale both sides: sprae 18.1->20.3kb, alpine 20.3->22.5kb (3.16.2) — still a win, now versioned
* [x] drops sortable-table snippet: displayed comparator never returned 0 (demo was already fixed, snippet wasn't synced)
* [x] ~~readme hint: :each items are reactive one level deep~~ fixed conceptually instead: lazy deep wrap
* [x] complete reactivity: shallow() -> lazy() in store.js — wrap-on-read via WeakMap(target->proxy);
      nested item mutations, nested :each, list-of-lists all reactive now; aliases share signals;
      bench flat (create 1k 31.5->30.3ms, append 20.4->20.4ms), verify:jfb OK, 431 tests pass
* [ ] refresh compare.md sizes at next full bench run (13.9.x grew ~0.7kb over 13.8.4)

Wedges (ranked by pain x absence-of-incumbent x unlock size):
* [ ] CSP/extension wedge: "reactive HTML in browser extensions, no eval" landing from csp.md + sprae-extension-template repo;
      answer standing SO/Reddit "alpine csp" threads with it — only segment with pain + budget where alpine structurally can't follow
* [ ] agent-native: llms.txt + editor skill = full reference + drops + gotchas; whole API fits in one prompt — unclaimed positioning;
      makes AI emit correct sprae (today it confidently emits the nested-push bug)
* [ ] playground permalinks: hash-encode editor content + share button (~50 lines, no backend) — every answer/issue/drop becomes a runnable link
* [ ] drops as tool, not gallery: per-drop URL + OG image, copy button, text search; reuse index playground per drop;
      reframe headline "how much code with other frameworks" -> "copy this"
* [ ] answer #68 (reusable components) as documented pattern
* [ ] one distribution act per release — artifact polish doesn't count

Kill (ego audit):
* [ ] "Used by" self-citations — cut until one external adopter
* [x] $1,728/mo sponsor tier — keep $5 goodwill tier
* [ ] tea.yaml
* [ ] stop: design variants (15 exist, ship one), krausest rank-chasing, pattern count growth before drops have URLs

Adjacent (money factored out) — collection direction:
* [ ] drops as curated museum: distill (not bookmark) UI tricks to minimal canonical form, one URL each, source credit, search
* [ ] every collected effect gets a control panel (params = state = sprae; settings-panel is prior art) — collections you play, not watch
* [ ] audio/media UI drops: waveforms, knobs, envelopes, sequencers — unfair authority (wavearea, web-audio-api), zero competition
* [ ] same corpus feeds three readers: self (reference), humans (gallery), agents (llms.txt)


## [ ] Indirect proposition / SEO articles (marketing pass 2026-08-21)

Filter: starving crowd — actively searching NOW with inadequate options, relief on finding; not "devs would find this neat".
Ranked: drops-URLs > CSP article > htmx companion > SSG tutorials > petite-vue intercept > effects→drops > agent-native; JSX killed.

Propositions:
* [ ] drops per-URL = the whole SEO strategy in one move: real queries are task-level ("sortable table vanilla js",
      "tabs no framework", "html only accordion", "show hide element javascript") — competition is 2014 jQuery SO answers
      + W3Schools; the drop page IS the answer (ideal ad = no ad), sprae rides along as the 11.6kb implementation detail;
      proven play — Pines UI / Alpine Components drive real Alpine adoption; post-drops star-velocity fall is not a verdict:
      the experiment never ran without URLs. Everything below is secondary to shipping this.
* [ ] htmx companion (new, rank high): htmx docs/community openly hand-wave the client-side-sprinkles gap at alpine/hyperscript;
      crowd is large, growing, pre-aligned (no build step, HTML-first, anti-React) and congregated — Dream-100 audience
      someone else already built; Datastar's rise proves signals+hypermedia demand; sprae composes with htmx, doesn't replace it
* [ ] SSG sprinkles (new): "add search to hugo site", "jekyll interactive component", "eleventy javascript without build step" —
      persona-perfect (their whole aesthetic = no js toolchain); one tutorial per SSG, one concrete task each
      (client-side search filter, dark-mode toggle, tabbed code blocks), each ends in a drop
* [ ] petite-vue intercept: dormant repo outselling 1.7x = standing traffic with maintenance-anxiety objection already attached;
      respectful + factual: migration table, what sprae does differently (signals, CSP, :each semantics), what petite-vue
      still does fine — two-sided messaging is the best-evidenced credibility tactic for skeptical devs
* [ ] effects: NO standalone collection — CSS owns motion now (view transitions, scroll-driven animations), GSAP entrenched,
      scope creep risk; fold into ~3 drops: enter/leave transitions on :if/:each (targets "x-transition",
      "animate element on remove javascript"), view-transitions with sprae
* [ ] JSX: killed as wedge — "JSX without build step" searchers want to WRITE jsx; sprae is the inverse paradigm, wrong persona,
      they bounce; real story is one docs paragraph: "render JSX server-side, hydrate with sprae, ship zero React"
* [ ] agent-native as social currency (distribution, not SEO): "framework small enough an LLM never hallucinates its API" —
      provable demo (AI confidently emits alpine's nested-push bug vs correct sprae); HN/Reddit act; compounds as AI answers
      become their own discovery channel

Article set (in order):
* [ ] per-drop pages, each drop = one page — long-tail volume, the compounding asset
* [ ] "Reactive UI in a Manifest V3 extension — no eval, no build" — q: "manifest v3 unsafe-eval", "alpine js csp",
      "framework for chrome extension"; flagship for the #1 wedge (big fish small pond: in "reactive HTML under strict CSP"
      sprae is the category leader, not an alternative)
* [ ] "Client-side sprinkles for HTMX" — q: "htmx alpine", "htmx client side interactivity"
* [ ] "Sprae vs Alpine.js, measured" — q: "alpine js alternative", "alpine vs"; measured sizes + krausest bench = proof
      alpine content lacks; MUST include where alpine wins (ecosystem, plugins, docs breadth) — the disqualifier is what
      makes the rest believable
* [ ] "petite-vue alternatives, 2026" — q: "petite-vue maintained", "petite-vue alternative"
* [ ] "Add interactivity to Hugo/Jekyll/Eleventy without a build step" — per-SSG queries, feeds drops

Caveats (honest):
* domain authority: sprae.js.org is young/low-authority; head terms ("alpine alternatives") vs LibHunt/dev.to listicles =
  6-12mo if at all; drops long-tail winnable much sooner (specific queries, decade-stale competition); for the first months
  an article's real distribution is SEEDING standing SO/Reddit/HN threads, not ranking — an article nobody seeds
  is artifact polish (kill-list)
* pain-first or don't write: product-first posts ("why sprae's reactivity is elegant") answer no standing query;
  every article opens on the searcher's task, solves it completely, mentions sprae the way a recipe mentions the pan;
  harvest actual thread language ("alpine csp" reddit, htmx discussions) before writing headlines
* comparison pages = challenger tactic: boosts recall of the named incumbent (leaders avoid it, challengers exploit it);
  only works with substantiated claims — sprae uniquely has them (versioned measured sizes, bench, csp table)
* sequencing: drops URLs first (substrate every article links into), CSP article second,
  then one article per release as the "one distribution act"
