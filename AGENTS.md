Reactive HTML templating. Bind state to DOM via `:` attributes. No build step.
Full API in `docs.md`.

## Codebase

| File | Role |
|------|------|
| `sprae.js` | Main entry. Registers directives, modifiers, default compiler. |
| `core.js` | Engine: `sprae()`, `parse`, `use`, `decorate`, `frag`, `start`, symbols. |
| `signal.js` | Built-in signals (preact-compatible API). |
| `store.js` | Reactive proxy store. Props → signals. Arrays, getters, methods. |
| `directive/` | One file per directive. `_.js` = default (any attribute). |
| `test/` | `test.js` entry, `directive/` per-directive, `modifier.js`, `mods.js`. |
| `types/` | Generated `.d.ts` (via `npm run types`). |
| `docs.md` | Public docs. **API changes must be reflected here.** |

## Commands

```sh
npm run test:base   # run tests (default signals + compiler)
npm run test        # run tests with all signal/compiler combos
npm run build       # esbuild bundle → dist/
npm run types       # generate types/ from JSDoc
```

## Exports

```js
import sprae, { store, signal, effect, computed, batch, untracked, start, use, throttle, debounce, dispose } from 'sprae'
import sprae from 'sprae/core'     // bare engine (no directives/modifiers registered)
import store from 'sprae/store'
import { signal, effect, computed, batch, untracked } from 'sprae/signal'
```

## Internal Symbols

| Symbol | Purpose |
|--------|---------|
| `_state` | Element's reactive state store |
| `_dispose` | Dispose function (= `Symbol.dispose`) |
| `_on` / `_off` | Enable/disable element effects |
| `_add` | Init child element (walk + apply directives) |
| `_signals` | Store's internal signals map |
| `_change` | Store's key-count tracking signal |

## Gotchas

1. Attribute order matters: `:each` before `:text`, not after.
2. `this` refers to current element in expressions.
3. `class` is reserved — use `cls` as variable name.
4. `_`-prefixed store props are untracked (not reactive).
5. `data-` prefix eats all `data-*` attrs — use spread `:="{ src: url }"` for ambiguous names.
6. Only valid HTML self-closing tags (`<input />`, not `<div />`).
7. Modifiers work on any directive (`:text.once`, `:fx.debounce-300`), not just events.
8. FOUC prevention: `<style>[\:each],[\:if],[\:else] {visibility: hidden}</style>`.
