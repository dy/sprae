# Sprae Values & Positioning

## One-liners

> **"Reactive HTML attributes. 5KB. No build step. Works everywhere."**

> **"Preact Signals meet HTML attributes. Alpine's API, half the size."**

> **"DOM microhydration — reactive sprinkles for HTML."**


## Core Identity

Sprae is reactive attributes for HTML. Progressive enhancement with signals. Think Alpine, but smaller and signals-powered.


## Key Strengths

### Size
~5KB min+gzip — smaller than Alpine (~10KB) and Petite-Vue (~6KB)

### Performance
Excellent benchmarks, especially memory efficiency (2.78 vs Alpine's 5.05, Petite-Vue's 3.16)

### Zero Dependencies
Core is self-contained, signals/evaluator are pluggable

### CSP-Compatible
Swap evaluator to justin for strict CSP environments (banks, enterprise)

### Simple Mental Model
Just reactive attributes — no virtual DOM, no components, no build step

### Modular
Pluggable signals (ulive, usignal, preact-signals, signal-polyfill), pluggable evaluator

### Future-Proof
TC39 Signals Proposal advancing — sprae's pluggable signals mean first to support native signals

### HTML-First
HTML remains valid without JS. Progressive enhancement: `:text="count"` element still shows fallback before hydration

### No Build Step
npm install optional. Appeals to developers burned by webpack/vite complexity


## Hidden Gems (Underexploited Value)

### 1. HTML-First Philosophy
The deeper value beyond reactive attributes: **HTML remains valid without JS**. Progressive enhancement angle is underexploited.

### 2. Server Component Bridge
JSX/prefix feature (`js-scope`) is killer for Next.js App Router. React Server Components can't have `onClick`, but sprae can hydrate them. **"Alpine for React Server Components."**

### 3. Signals Agnostic = Future-Proof
TC39 Signals Proposal is advancing. Pluggable signals = first to support native signals when browsers ship.

### 4. The "Anti-Build" Movement
Growing fatigue with complex toolchains. No-build-step story appeals to developers burned by tooling complexity.

### 5. Micro-Bundle Opportunity
`micro.js` (2.5kb) could target IoT/embedded/email HTML where every byte matters.


## Perfect Use Cases

1. **Progressive Enhancement** — Add interactivity to server-rendered HTML (Rails, Django, PHP, static sites)
2. **Micro-frontends** — Small reactive widgets embedded in larger apps
3. **Prototyping** — Quick UI mockups without build tooling
4. **Forms & Inputs** — Reactive form validation, dynamic field visibility
5. **Admin Panels** — Lightweight dashboards without SPA overhead
6. **Static Site Generators** — Jekyll, Hugo, 11ty with client-side interactivity
7. **CSP-Strict Environments** — Banks, enterprise with justin evaluator
8. **Performance-Critical Landing Pages** — Where every KB matters
9. **Server Components Enhancement** — Next.js/React server components with client logic
10. **Embedded Widgets** — Third-party embeds (comments, polls, calculators)


## Market Position

```
                    Simple ←————————————————→ Complex
                         │
        Sprae ●          │           ● Solid
     (directives)        │         (fine-grained)
                         │
    Alpine ●             │              ● Vue
                         │
                         │                  ● React
        ─────────────────┼─────────────────────
       Progressive       │        Full SPA
       Enhancement       │
```

**Sweet spot**: Progressive enhancement with signals, smaller than Alpine, no build required, CSP-compatible.


## Comparison Table

|                       | Alpine          | Petite-Vue        | Sprae            |
|-----------------------|-----------------|-------------------|------------------|
| _Size_                | ~10KB           | ~6KB              | ~5KB             |
| _Memory_              | 5.05            | 3.16              | 2.78             |
| _Performance_         | 2.64            | 2.43              | 1.76             |
| _CSP_                 | Limited         | No                | Yes              |
| _Evaluation_          | `AsyncFunction` | `new Function`    | Pluggable        |
| _Reactivity_          | Alpine.store    | @vue/reactivity   | Pluggable signals|
| _Build Required_      | No              | No                | No               |
| _Fragments_           | Yes             | No                | Yes              |
| _Modifiers_           | Yes             | No                | Yes              |


## Why Sprae

- Wire UI in markup for cleaner app logic
- Perfect for SPA, PWA, static sites, prototypes, micro-frontends
- Inspired by preact-signals, alpine, lodash
- Made for better DX — for those tired of complexity


## Taglines / Principles

- **Minimal** — 5KB, zero dependencies
- **Progressive** — HTML works without JS
- **Reactive** — Signals-powered updates
- **Flexible** — Pluggable signals & evaluator
- **Safe** — CSP-compatible with justin
- **Future-proof** — Ready for TC39 signals
