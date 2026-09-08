---
title: "Sprae directives reference"
description: "All 20 sprae directives and 20 modifiers in one page, each with what it does and its Alpine.js equivalent."
permalink: /directives/
---

# Directives

An element can carry several directives, and they initialize in written order: `:if :each` is not the same as `:each :if`. Combining names on one expression, `:id:name="field"`, applies it to both attributes.

Every directive is a plain HTML attribute. There is no build step, no compiler and no template language: the value is ordinary JavaScript, evaluated against the nearest `:scope`. Syntax and examples for each one are in the [readme](https://github.com/dy/sprae#directives); the [homepage reference](/#directives) shows them interactively.

## State

| Directive | What it does | Alpine |
|---|---|---|
| `:scope` | Declare local state on any element and let its subtree read it. | `x-data` |

## Structure

| Directive | What it does | Alpine |
|---|---|---|
| `:if / :else` | Insert and remove DOM branches from an HTML attribute, including multi-element fragments via template. | `x-if` |
| `:each` | Render a list from arrays, objects, Maps or a number, keyed by identity so rows are reused instead of rebuilt. | `x-for` |
| `:hidden` | Hide an element while keeping it in the DOM and keeping its state alive. | `x-show (inverted)` |
| `:portal` | Teleport an element into another container, reactively. | `x-teleport` |

## Content

| Directive | What it does | Alpine |
|---|---|---|
| `:text` | Write reactive text into an element, escaping automatically. | `x-text` |
| `:html` | Insert reactive HTML and initialize the directives inside it. | `x-html` |
| `:class` | Toggle classes from an object, array or string without clobbering the classes already on the element. | `x-bind:class` |
| `:style` | Set inline styles and CSS custom properties from an HTML attribute. | `x-bind:style` |
| `:<attr>` | Bind disabled, href, src, aria-* or any other attribute straight from an expression, with several attributes sharing one expression. | `x-bind:attr` |
| `:="{…}"` | Spread an object of attributes onto an element from a single HTML attribute. | `x-bind="obj"` |

## Forms

| Directive | What it does | Alpine |
|---|---|---|
| `:value` | Write state into inputs, textareas, checkboxes, radios and selects. | `x-model (read half)` |
| `:change` | Take a value out of a form control and put it into state, with type coercion and modifiers like debounce. | `x-model (write half)` |

## Events

| Directive | What it does | Alpine |
|---|---|---|
| `:on<event>` | Attach DOM event listeners from HTML, with modifiers for debounce, throttle, prevent, stop, key filters and alternate targets. | `x-on:event / @event` |
| `:on<a>..on<b>` | Run setup on one event and cleanup on another, so paired listeners like focus/blur or pointerdown/pointerup cannot leak. | `no equivalent` |

## Lifecycle

| Directive | What it does | Alpine |
|---|---|---|
| `:fx` | Run an expression whenever its dependencies change, returning a cleanup function for timers and subscriptions. | `x-effect` |
| `:ref` | Put an element into state under a name, or run a function against it as soon as it exists. | `x-ref / $refs` |
| `:mount` | Run a hook once when an element connects and clean up when it leaves. | `x-init` |

## Observers

| Directive | What it does | Alpine |
|---|---|---|
| `:intersect` | An IntersectionObserver in an HTML attribute, for lazy loading, reveal animations and infinite scroll. | `x-intersect (plugin)` |
| `:resize` | A ResizeObserver as an attribute, for layout that depends on the element’s own width rather than the viewport’s. | `no equivalent` |

## Modifiers

Modifiers chain onto a directive name with `.` and apply left to right, so `:onkeydown.ctrl-s.prevent` gates the key combination first, then prevents the default, then runs the expression. Most apply to `:on<event>`; the timing ones apply to any directive.

| Modifier | Effect | Example |
|---|---|---|
| `.debounce` | Run after activity settles. | `:oninput.debounce-300="search()"` |
| `.throttle` | Limit call frequency. | `:onscroll.throttle-100="track()"` |
| `.delay` | Postpone every call. | `:onmouseenter.delay-500="show = true"` |
| `.once` | Run only once. | `:onclick.once="init()"` |
| `.raf` | Run on the next animation frame. | `:onscroll.raf="measure()"` |
| `.idle` | Run during idle time. | `:fx.idle="prefetch()"` |
| `.tick` | Run in the next microtask. | `:fx.tick="sync()"` |
| `.window` | Listen on window. | `:onkeydown.window.esc="close()"` |
| `.document` | Listen on document. | `:onclick.document="track()"` |
| `.body` | Listen on body. | `:onpointerdown.body="start()"` |
| `.root` | Listen on the html element. | `:onkeydown.root="route()"` |
| `.parent` | Listen on the parent. | `:onclick.parent="select()"` |
| `.self` | Ignore descendant events. | `:onclick.self="close()"` |
| `.away` | Listen outside the element. | `:onclick.away="open = false"` |
| `.prevent` | Prevent default behavior. | `:onsubmit.prevent="save()"` |
| `.stop` | Stop event propagation. | `:onclick.stop="handle()"` |
| `.passive` | Never block scrolling. | `:ontouchstart.passive="pull()"` |
| `.capture` | Listen during capture. | `:onclick.capture="intercept()"` |
| `.enter` | Filter for a key; `.ctrl` `.shift` `.alt` `.meta` combine with any key. | `:onkeydown.enter="send()"` |
| `.<any>` | Any other name is ignored, which lets one attribute occur twice. | `:onclick.a="x()"` and `:onclick.b="y()"` |

## Where to go next

- [Examples](/drops/) - 34 working components built from these directives, code beside the live result.
- [Migrating from Alpine](/alpine/) - every Alpine directive, magic and plugin with its sprae equivalent.
- [Strict CSP](/csp/) - the same directives with no `eval` and no `new Function`.
- [Comparison](/compare/) - measured size, speed and memory against Alpine and petite-vue.
