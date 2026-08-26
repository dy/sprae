# Sprae Visual Direction

## 1. Design thesis

**Editorial archive poster × experimental institutional identity × developer documentation.**

The site should feel like a contemporary public-program / design-archive poster translated into a web interface: precise, typographic, quiet, technical, and slightly atmospheric.

Source corpus: the NID Archives Public Programs 2021–22 identity (*Experiments in Art and Technology: India 1960s & '70s* — A4 poster, Instagram square series, wide banner) and the 2024 Spræ poster adaptation of it. The system's proof is that the same small kit survives every format.

It is **not** a generic SaaS landing page and **not** a conventional component-library site.

Core tension:

- rigorous grid + irregular composition
- large quiet typography + tiny technical annotations
- pale paper + deep navy code
- functional documentation + atmospheric blue mist
- minimal interface chrome + strong editorial hierarchy

The result should feel **designed, not decorated**.

---

## 2. Visual character

### Overall mood

- archival
- institutional
- technical
- calm
- precise
- slightly strange / experimental
- understated rather than luxurious
- contemporary without looking trend-driven
- confident without marketing theatrics

Think: an exhibition programme, research institute poster, catalog spread, or printed archive notice — adapted to a working developer site.

### Avoid

- glossy SaaS gradients
- glassmorphism as a dominant language
- generic equal-size card grids
- pill-heavy UI
- oversized rounded corners everywhere
- stock illustrations
- shiny 3D icons
- random blobs
- excessive shadows
- marketing badges
- excessive CTAs
- gradients trapped inside individual cards
- bright rainbow syntax or neon cyberpunk code
- “startup landing page” composition

---

## 3. Color system

The page is mostly pale and low-contrast, with navy as the primary ink and blue/cyan appearing as atmospheric light.

### Base

- Paper white: `#DFDFDF`
- Cool white: `#F8F8F6`
- Soft gray: `#E9EAEC`
- Rule gray: `rgba(12, 39, 89, 0.14)`

Near mist, paper may pick up a faint periwinkle/violet cast (the source posters sit on a lavender-gray ground). The cast is always cool — never warm gray, never cream.

### Ink

- Text ink: `#233A7E`
- Deep navy: `#0A245C`
- Near-black navy: `#07172F`
- Primary blue: `#1547D8`
- Cobalt: `#0C43C9`

### Mist

Use broad blurred fields rather than obvious radial-gradient circles.

- Cyan mist: `#36B9E8`
- Blue mist: `#4D83D8`
- Indigo mist: `#5369B8`
- Very pale blue: `#C9D9F4`

The mist should be **asymmetrical**, flowing through large portions of the page, as though printed ink diffused into paper.

Do not make the page uniformly blue. Keep large areas nearly white.

---

## 4. Background treatment

Background is a major part of the identity.

Use:

1. off-white / cool-gray base
2. very large soft-focus blue/cyan/indigo fields
3. subtle monochrome grain/noise over the whole page
4. occasional almost-invisible horizontal section boundaries

The blur should feel **misty, photographic, or ink-diffused**, not like normal CSS “gradient blobs.”

Preferred composition:

- stronger cyan/blue on the left or lower-left
- white opening toward upper-right
- indigo/blue returning in the lower half
- no obvious symmetry
- no hard gradient edges

Grain should remain visible even in pale areas.

Grain sits **on top of everything** — mist, type, and code panel included — so ink reads as printed into the paper rather than layered over it. Keep it monochrome and fine.

The mist recomposes freely from section to section, exactly as it shifts from poster to poster in the source series, while the signature marks (§6) repeat unchanged. Fixed marks, variable weather.

On screen, the wash is slow but visibly alive. Randomize pool position, scale, phase, and pace within bounded ranges on each load; drift pigment and wet-edge texture continuously rather than looping an obvious morph. Pigment should occupy about half the viewport or less at once, leaving a substantial paper opening. Freeze the field for `prefers-reduced-motion`.

The wash canvas is **absolute over the opening composition**, never fixed to the browser. Its height is computed from the actual hero/Features boundary plus `20svh` (with `120svh` as the CSS fallback), so short screens and wrapped mobile heroes still receive the full extension. It stays opaque through the hero, then masks away over that final `20svh` instead of ending on a hard viewport edge. It scrolls away with the opening composition.

Production compiles **only mode 7 (`spray`)**. `assets/shaders.js` contains that shader and its material trail only; it has no physical-smoke dependency. A persisted **spray / gradient** comparison may hide the canvas and show a CSS-only Bloom Field study derived from the supplied 21st.dev gradient preset; this does not compile another shader. The reference composition uses four layered radial blooms on `#e2e2e2`—gray at `54.5% 37.91%`, blue at `43.74% 91.2%` and `25.82% 27.32%`, cyan at `108.69% 81%`. Reproduce the linked preset’s `grain: 100` visibly: a 120px stitched `fractalNoise` tile (`baseFrequency .9`, two octaves) at 50% opacity with `overlay` blending, in addition to the quieter page-print grain. The Gradient-only **new** action recomposes the same four blooms within bounded regions and cross-fades between two CSS layers; it changes composition, never palette or shader payload. Keep the same corner overlays, height, and final `20svh` mask, and pause WebGL frame work while Gradient is selected. Every other shader remains exclusively in `design-variants/7-shaders.html`, whose laboratory retains the complete 1–11 switch.

Gallery modes **7 (`spray`) and 8 (`fog`)** must translate visibly over a five-to-ten-second observation: whole plumes/cells migrate while their internal texture circulates more slowly. Their color is restrained duotone, not monochrome and not rainbow — broad cyan/periwinkle and steel-blue/indigo regions move with their sources rather than through a screen-fixed gradient. Mode 7 is explicitly two persistent density layers, each with its own sources, fold, texture, and constant-speed drift; both colors exist before pointer input. Pointer matter is a third visual volume sampled at several radii: a broad blurred cyan atmosphere surrounds a denser blue core, with low-frequency billow and directional density variation preventing a flat interior. Density accumulates asymptotically and the held radius grows only modestly, so the center does not become a flat disk. On release, the simulation increases its diffusion radius while retaining matter for roughly three times longer: the mark visibly expands and softens before it fades.

The shader gallery keeps the stylized plume as mode 9 and adds **mode 11, `smoke·sim`**, as a separate physical study. Mode 11 is not a procedural cloud mask: it uses semi-Lagrangian velocity/density advection, buoyancy, vorticity confinement, divergence measurement, an iterative pressure solve, and pressure-gradient projection. Render only the resulting simulated density through the shared paper → pale blue → steel blue → indigo colormap; temperature may select the cyan accent. Noise may texture the paper or modulate the emitter, but must never invent the smoke silhouette. Pointer travel adds momentum; press-and-hold injects matter and heat. Under reduced motion, pre-settle once and then freeze.

---

## 5. Typography

Use a **clean geometric grotesk** with a wide weight axis (light ≈300 through bold ≈700+) and slightly technical detailing. Space Grotesk is the closest match to the source posters; Geist and Bricolage Grotesque are workable cuts.

Do not rely on serif typography.

### Two display registers

1. **The wordmark** — lowercase `spræ`, the `æ` ligature being the canonical poster form. The only lowercase display object on the page.
2. **Caps identity register** — ALL-CAPS bold stacks: the rotated strip, corner metadata, session-style titles. Set tight: line-height ≈ 0.95–1.05, tracking ≈ 0 (never letterspaced), left-aligned, hard-stacked.

Everything else is sentence-case body or tiny mono annotation. Caps at display size are normal in this system; what stays sentence case are statements and body.

### Weight pairing

The core hierarchy device is **weight contrast at equal size**, not size change:

- bold caps title + light attribution beneath (`THE SOUND STUDIO` / `Paul Purgas`)
- light label + bold list (`Presenters:` → bold names, one per line)
- light paragraph with **bold inline facts** — dates, sizes, versions, URLs (“begins on **30-07-2021** … from **19:30 to 21:00 (IST)**”)
- connectors stay light (`&`, `with`, `in conversation with`)

Caps stacks may also step size mid-block: a large bold line followed by a smaller bold caps line in the same left-aligned block (`ISRO E.A.T. NID:` / `CREATIVE FREEDOMS AND EMERGING TECHNOLOGIES`).

### Hierarchy

#### Display / hero
- very large
- tight tracking, compact line-height
- either the lowercase `spræ` wordmark or a bold caps stack

#### Main statements
- bold or semibold
- concise
- 1–3 lines
- sentence case

#### Body
- light or regular
- compact but breathable
- cool navy/gray rather than pure black
- short paragraphs

#### Technical labels
- mono or mono-like
- small
- restrained
- used for filenames, directives, package names, metrics labels, section tags

### Typographic behavior

The page should juxtapose extremes on one surface:

- huge wordmark or rotated caps strip
- medium editorial statement
- very small technical annotation

That contrast is essential. Middle sizes are rare.

---

## 6. Signature marks

The recurring kit that makes an artifact recognizably part of the system. These repeat — near-identically — across every format while composition and mist re-flow around them.

### Rotated identity strip

The brand carrier. A caps stack rotated 90° counter-clockwise (reads bottom→top), pinned to an outer grid edge. On the root hero, `NOT A FRAMEWORK` sits on the right boundary of the final column, its foot raised to half the code panel's width above the hero's bottom edge:

- 2–3 hard-stacked lines, bold claim + light qualifier at the same size
  (source: `EXPERIMENTS IN ART AND TECHNOLOGY` bold / `INDIA 1960s & '70s` light;
  sprae: `THE SMALLEST, FASTEST — WAY TO ADD REACTIVITY TO HTML.`)
- the root label uses a short partial underline, never a full-height rule or leading em dash
- other identity strips may terminate with a dash in reading direction
- scales from display (in the hero it rivals the wordmark) down to caption (repeated on cards) with structure unchanged

### Corner metadata block

Top-left imprint: the year rotated 90° (`2024`) set flush beside a stacked bold caps program name (`SPRAE` / `REACTIVITY` / `FOR HTML`). Small, bold, tight — the institutional stamp of the page.

### Logo

Use the literal Unicode therefore mark `∴` as the Sprae logo. Do not redraw it as connected circles or substitute a custom SVG node. The mark may sit alone in navigation or precede `spræ` in compact signatures.

### The dash

A short thick rule (≈2–4px × 1.5–3em, square ends, ink color) used as punctuation, not decoration:

- standalone in open mist areas, marking “content lives here”
- above a paragraph or tiny label as its anchor
- rotated along with vertical strips
- the only list marker — tips and loose lists take dashes
- never in decorative rows, never full-width, never the ∴ tridot (the logo mark)

### Metric anatomy

Oversized numeral → rule beneath → small light multi-line caption below the rule (`~11kb` / rule / “Gzipped. Works with any backend or template.”). Stats sit side by side, top-aligned.

### Floating metadata stack

A small light-weight stack floating in mist space (source: `Friday` / `10 Sept 2021` / `7:30 PM IST`). Site equivalents: version stamp, release date, build target.

### Footnote

Small light text opening with `*`, placed directly under the block it qualifies (“*detailed list of participants and synopsis will be shared before each session”).

### Quiet CTA

A tiny text label with a dash above it, pinned to a corner (`Link in Bio`). Links are labels, not buttons.

### Edge micro-text

Tiny rotated text running along the right edge (source: “For enquiries, contact archives@nid.edu”). Site equivalents: repo link, license, colophon.

### Credits strip

Bottom edge: mark/logo plus tiny credits spread wide across the full width, justified far apart.

---

## 7. Layout and grid

Use a strict underlying grid, but avoid making the layout look mechanically centered.

### Global composition

- wide margins
- generous negative space
- asymmetric alignment
- blocks can begin on different columns
- some content can be vertically oriented
- thin rules and dashes may anchor disconnected areas
- avoid a repeated “heading centered above 3 cards” rhythm

**Edge-anchored composition**: type clusters hug the edges and corners of the canvas; the center stays airy — mist plus at most one paragraph. Blocks are separated by large voids and tied together by dashes and the shared grid, never by boxes.

The site should feel like a sequence of **editorial compositions**, not a stack of standard web sections.

The source identity survives A4, Instagram square, and wide banner by recomposing the same kit. Translate that: hero = the poster, feature/section cards = the square cuts, OG and social images = direct reuse. Signature marks stay fixed; mist and content re-flow.

### Alignment

Use a consistent 10-column desktop grid. The grid is construction logic, not decoration: its guides are hidden by default, fixed to the viewport when enabled, and remain visible over the full document through the persisted `grid` design-aid toggle.

Typical alignments:

- top nav: sparse across upper edge
- hero wordmark: slightly left of center
- supporting statement: offset to the right
- vertical annotation: right boundary of the final grid column, reading bottom→top
- code panel: centered or slightly offset below the title
- features: built as an irregular composition immediately after the hero

---

## 8. Hero

The hero establishes the entire system.

### Components

- corner metadata block top-left: rotated year + stacked `SPRAE / REACTIVITY / FOR HTML`
- sparse navigation / quiet links opposite it (`sprae.dev`, GitHub) — labels, not buttons
- large `spræ` wordmark, preceded by a standalone dash
- concise bold statement such as:
  - **Minimal reactivity for HTML**
  - **Add reactivity to HTML with :attributes.**
- one short light explanatory paragraph
- rotated identity strip on the right edge of the final grid column, reading bottom→top:
  - `THE SMALLEST, FASTEST — WAY TO ADD REACTIVITY TO HTML.`
  - or bold `NOT A FRAMEWORK` + light qualifier
- metric pair set with the §6 anatomy (`~11kb`, `434 tests`)
- large dark code panel
- small “Live” status
- minimal interactive output

### Code panel

The code panel is the primary solid object on the page.

Use:

- deep navy / near-black background
- very restrained rounding
- no heavy shadow
- cool syntax: cyan directive names, white quoted values/expressions, pale JS keywords, and muted tag names, visible text, comments, and punctuation
- boolean directives such as `:else` and the bare spread name in `:=""` receive the same cyan directive treatment as assigned directives
- every highlighted code surface uses the same `--code-size`, `--code-weight`, and `--code-leading`; token spans inherit a restrained 500 weight rather than becoming bold
- minimal chrome
- thin internal rule
- small `Live` indicator
- output controls integrated into the panel rather than styled as separate app UI
- live output grid: same-size 1px dots every 8px, with a slightly stronger dot every 32px registered directly over a fine-grid dot
- example buttons use an opaque plate-colored fill so the grid never shows through them

It should feel like an archival display plate, not an IDE screenshot. The transition begins exactly at the live-demo half of the plate. The **Features section itself** owns the fill: pull it upward with a computed negative margin until its top edge equals that live-demo rule, then add the same amount back as top padding so feature content still begins below the hero. Do not use a hero pseudo-element or a second fill.

The divider follows `design-variants/transition.png`: one desaturated 2px gray-blue rule at 22% alpha spans almost the viewport, leaving a responsive 16–32px edge gap. Its bottom edge—not its top edge—meets the Features boundary, so both pixels remain over the sprayable field rather than the paper cover. It ends sharply at both bounds—never feather the line itself—and must retain `mix-blend-mode: multiply` so it stays present through pigment without becoming saturated. Keep the spray canvas’s exact final-`20svh` vertical mask. Above it, add two square paper overlays whose bottoms align precisely to the divider: a `45deg` wedge at lower left and a `-45deg` wedge at lower right. Each fades from opaque paper through `--paper-veil` to transparent before reaching its other edges, producing a visible soft corner vignette without dimming the center. Features adds a transparent-center paper gradient from both sides so the sprayed upper field never meets the lower ground at a hard edge. The plate stays above divider and ground.

---

## 9. Features / Bands

Features begins visually at the hero's live-demo rule, not after the hero. It is one full-width element pulled upward by `--feature-overlap`; equivalent top padding preserves the normal content position. Its background uses only a center-symmetric horizontal paper fade and a 64%-paper-to-solid vertical cover, revealing the actual spray beneath more quietly than before. Do not add a separate cyan radial haze or bias either side; left and right must resolve identically into flat `--paper` before the section ends.

There is no visible Features heading or layout selector. **Bands is final.** Four equal full-width columns use only dashed dividers and generous vertical space—no Field variant, card fill, card radius, or nested marketing chrome. Collapse to 2×2 at `64rem`, then one column × four rows below `40rem`.

Keep the four propositions short and non-overlapping:

1. **Keep your HTML.** Show the eight official HTML5, React/JSX, Next.js, Astro, Rails, PHP, Django, and Jekyll marks in that order, without circles or visible labels. The copy does not repeat the names: “Add reactive attributes in place. No component rewrite or required build step; server components stay server-side.”
2. **Direct DOM, measured.** Use `assets/benchmark-cpu.webp`, an optimized crop of the official js-framework-benchmark incremental result centered on Sprae v13.8.4, as a low-saturation multiply-blended image with paper fades on all four edges. Keep the factual summary short: no virtual tree or diff; published runs place Sprae ahead of Vue, React, and Alpine while Svelte remains a fast peer. Link the current official table and local methodology.
3. **Own state. Swap signals.** Replace the table with five quiet ruled rows. Each row is only the implementation and documented compressed size—built-in ~300b, `@preact` 1.5kb, ulive 350b, signal 633b, usignal 955b—with a small selected dot. Remove headers, roles, boxed table treatment, and connection snippets. Copy only adds the point not visible in the rows: `sprae()` returns live state.
4. **The specification.** Use a nine-row definition list instead of prose: package 11.6kb gzip; dependencies 0; CPU 2.27× vs Alpine; memory 5.1MB/1k rows; first paint 76ms/1k rows; CSP build full JS; vocabulary 20 directives + 20 modifiers; MIT; version 13.9.1. CPU, memory, and paint inherit the dated methodology in `compare.md`; do not silently present them as cross-machine absolutes.

After the four columns, show one static **capability tag cloud**—no heading, subtitle, reference link, clipped edges, duplicate sets, or automatic motion. Its content covers architecture (no virtual DOM, keyless lists, evaporating attributes, no component stack, direct node effects, DOM ownership), lifecycle (async expressions, `:mount`, cleanup, intersection, resize, portals), and reach (custom elements, computed stores, refs, spread, event chains, debounce/throttle, TypeScript).

The cloud is exactly `--shell` wide—the same ten-column editorial width—and wraps naturally from one centered flex field. Tags use a simple pale fill and a restrained 3px radius, never outline-only chips or pills. Every capability retains its concise tooltip after an 850ms hover delay or immediately on keyboard focus.

---

## 10. Iconography

Icons should feel as if they belong to the same poster system.

Use:

- simple geometry
- line icons
- dot grids
- pixel-derived forms
- circles, nodes, crosses, brackets, apertures, targets
- simple diagrams
- slightly technical / diagrammatic character

Good motifs:

- dotted square / small square inside
- radiating node
- sliders / parallel lines
- `< />`
- dotted matrix
- plus
- concentric circles
- Sprae three-dot node mark

Avoid:

- stock icon sets with mixed stroke logic
- multicolor icons, except locally stored official ecosystem favicons used as factual source/framework marks
- glossy 3D objects
- detailed illustrations
- emoji-like symbols

---

## 11. Usage section

Usage should read more like documentation than marketing. Its section ground is a neutral gray slightly darker than Features paper—never bluer and with no atmospheric wash. Dark navy copyable code rows provide the only strong surfaces.

Remove the layout selector and all card shells. Show CDN, ES module, Next.js/JSX, and Markdown/SSG in one fixed 2×2 field. The only structural graphic is a one-pixel vertical and horizontal rule crossing at the exact center; there is no outer border, fill, or radius around a quadrant. Give each quadrant an inset toward the cross while keeping the shell edges open. Supporting lines use normal 16px body type rather than caption type. Below `40rem`, stack the four contexts and replace the impossible cross with simple horizontal separators.

Each context owns exactly one dark code block and one copy control. Combine alternatives or consecutive setup lines inside that block, using one quiet comment only where the distinction would otherwise be ambiguous. Run every block through the shared syntax highlighter. Code wraps in place (`pre-wrap` plus anywhere wrapping): neither a block nor the page may gain a horizontal scrollbar. Dark snippets remain square-edged, and every copy control retains a minimum tap target and pale ink.

---

## 12. Directives / reference

Reference is one inverted deep-navy documentation field with **no visible “Reference” heading**. Compact mode is final: retain only Directives / Modifiers tabs and remove the Full / Compact study control.

Each row uses a true `3/7` split. The left column stacks a compact 16px mono name over a one-sentence 14px descriptor. The right column prints exactly **one** complete example directly on the section ground—no nested fill, border, radius, truncation, ellipsis, comments, blank lines, or horizontal scrolling. Source uses `pre-wrap` and anywhere wrapping so long tags break naturally. Separate visual rows by exactly 48px (two code lines). One `::before` rule at 30% spans the **entire list height**, including those gaps; never fake it with per-row borders. Below `40rem`, stack each row and replace the vertical divider with a quiet horizontal boundary.

Expose 19 directive rows and 20 modifier rows. Combine `:if / :else` as one conditional example; keep ordinary attributes and spread attributes separate, and retain the documented `.stop-immediate` and `.enter` modifiers. Do not invent API merely to balance counts.

---

## 13. Examples band

Examples keep one Guide composition with a local **list left / list right** study. **List right is the default:** the specimen occupies columns 1–7 and the six-row example rail occupies columns 8–10. List left preserves the former 3/7 order. Below `48rem`, hide the irrelevant study control and stack rail before specimen. The rail contains five substantial examples: sortable table, tag input, stopwatch, live filter, and async action. Each number and title shares a true baseline; neither uses tracking. Titles use the display family, one-line descriptions use the body family, and only source code is monospaced.

The selected specimen contains **only** the printed code and live output. Its height now follows the selected source naturally: remove fixed stage heights and vertical caps. Source wraps instead of scrolling horizontally; the iframe fills the resulting side-by-side height with an `18rem` floor. Below `64rem`, source and output stack with an `18rem` output row. One iframe runs the exact code printed.

The example rail has six equal 68px rows: five live specimens followed by **06 · All examples →** as the final list item. Do not leave a separate CTA beneath the composition. Height changes between examples are now intentional because they reveal actual source length.

---

## 14. Comparison

Comparison is an explicit 50/50 pair. The two independent code plates have equal tracks, equal visual weight, full rounding, and a restrained gutter rather than joining into one wide object. The `sprae` title sits outside and above the left plate. Alpine, Vue, React, Svelte, and Vanilla are immediate tabs outside and above the right plate—never a select menu and never embedded in code chrome. Use locally downloaded official site favicons with `mix-blend-mode: multiply`: Alpine `favicon.png`, Vue `logo.svg`, React `favicon-32x32.png`, Svelte `favicon.png`, and JavaScript.com’s favicon for Vanilla. Line count, build requirement, and runtime sit on the paper **below and outside** each dark plate. Do not add a concluding explanatory line beneath the pair; benchmark and comparison links already exist elsewhere. Preserve the pair through `44rem`; below that, sequence Sprae label → Sprae plate → Sprae stats → framework tabs → competing plate → competing stats.

---

## 15. FAQ

Uncollapsed two-column question list — every answer visible at once. Semibold questions, plain answers, links underlined. No accordions, plus markers, or expanders.

---

## 16. Gray editorial section

Use a cool light-gray section as a deliberate tonal reset after the mist-heavy upper page.

This section can carry more narrative content.

Recommended layout:

- left: section label + large statement
- right: dark code object or archival figure
- oversized year / metric used as typography
- one centered or offset manifesto line near the bottom
- sparse blue mist entering from one corner

Example tone:

**Tiny reactivity,  
big possibilities**

Short body copy.

Large numerical or historical marker.

Then a concise statement such as:

**Small software survives by staying useful.**

This section should resemble an exhibition catalog spread more than a product feature block.

---

## 17. Content voice

The copy is compact, declarative, technical, and anti-hype.

### Principles

- short sentences
- concrete claims
- avoid empty adjectives
- no “revolutionary”
- no “powerful developer experience”
- no marketing filler
- no fake urgency
- explain mechanisms, not vibes
- key facts (sizes, dates, versions, URLs) bolded inline within light text
- qualifications delivered as `*` footnotes under the block, not woven into the claim

### Preferred constructions

- Minimal reactivity for HTML.
- Add reactivity. Not a regime.
- Keep your HTML.
- No virtual DOM.
- No build step.
- One script tag.
- Direct state access.
- Swap signals when you need to.
- The markup stays yours.
- HTML arrives.
- Bindings connect.
- Attributes leave.
- Small software survives by staying useful.

### Principle labels

**Minimal**  
Tiny by default. Only what you need.

**Open**  
Open source and community driven.

**Practical**  
Built for real projects and real developers.

### Supporting principles

**HTML-native**  
Keep your HTML. Write standard JS.

**Zero dependencies**  
No dependency tree. No supply chain.

**Open & pluggable**  
Direct state access. Swappable signals and custom directives.

---

## 18. Interaction style

Motion should be sparse and meaningful.

Good:

- hover reveals binding relationships
- subtle mist drift
- code/output state synchronization
- small underline or line-motion changes
- attributes visually evaporating
- gentle focus transitions

Avoid:

- springy component animations
- floating cards
- parallax everywhere
- continuous ornamental motion
- big hover scaling

The page should remain composed even when nothing moves.

---

## 19. Responsive behavior

On mobile:

- preserve the editorial hierarchy
- do not simply stack every block into identical cards
- allow the wordmark and statement to remain large
- move vertical annotations to horizontal labels if necessary
- code panel becomes full-width
- Features steps from four Bands columns to 2×2 at `64rem`, then one × four below `40rem`; the Usage cross also stacks below `40rem`
- the Examples position study collapses to rail-first and hides its switch at `48rem`; Reference retains its `3/7` split through tablets and stacks below `40rem`; Comparison remains side by side until `44rem`
- tables and code may scroll inside their own bounds, never the page
- keep generous whitespace

---

## 20. Reusable master prompt

Design a page for **Sprae**, a tiny HTML-native reactive JavaScript library.

The visual language is **an experimental design-archive/public-program poster translated into a developer website**: editorial, institutional, technical, quiet, precise, and slightly atmospheric.

Use a cool off-white/light-gray paper background (faint periwinkle cast near mist) covered by subtle monochrome grain that sits over everything, type included, so ink reads as printed. Introduce soft-focus cyan, cobalt, blue, and indigo mist that flows asymmetrically through the composition while leaving a substantial white opening. The mist must feel like diffused ink or blurred photography, not ordinary radial-gradient blobs. On screen it drifts continuously and randomizes bounded pool position, scale, phase, and pace per load; freeze it for reduced motion and keep its visible footprint to about half a viewport or less.

Use deep navy and cobalt typography set in a geometric grotesk with a wide weight axis (Space Grotesk character). Two display registers: the lowercase `spræ` wordmark, and tight ALL-CAPS bold stacks (line-height ≈1, tracking ≈0, never letterspaced) for the rotated strip, corner metadata, and titles. Hierarchy comes from weight pairing at equal size — bold caps title over light attribution, light label over bold list, light paragraphs with bold inline facts — plus tiny mono technical annotations. Statements and body stay sentence case.

Build the page on a strict editorial grid but keep the composition asymmetric and edge-anchored: type clusters hug corners and edges, the center stays airy, blocks are tied together by short thick dashes (the system’s punctuation — standalone in open space, above paragraphs and labels, ending rotated strips) rather than boxes. Avoid conventional centered SaaS sections.

The hero should include the corner metadata block (rotated year beside stacked bold caps `SPRAE / REACTIVITY / FOR HTML`), quiet text links opposite it, a very large `spræ` wordmark preceded by a standalone dash, the bold statement **“Minimal reactivity for HTML”** or **“Add reactivity to HTML with :attributes.”**, one short light explanation, `NOT A FRAMEWORK` rotated bottom→top at the right boundary of the final grid column with a short partial underline, a metric pair set as numeral → rule → small caption, and a large dark navy live code panel. The code panel should be flat and archival rather than glossy: restrained corners, a restrained cyan shadow, cyan directives, white expression values, muted markup/content, a small `Live` indicator, and minimal output controls integrated into the panel. Its live area uses same-size 1px dots on 8px and 32px grids, precisely registered, with opaque plate-filled buttons.

After the hero, let Features overlap upward to the live-demo rule and own the entire transition ground. Use only the four-column Bands structure from §9: unlabeled source favicons; a softly faded official CPU-result crop; a five-row, single-line signals list; and a nine-row verified specification. Keep all copy terse and avoid repeating what a graphic already says. Follow the four columns with a ten-column static capability tag cloud—no heading, CTA, outlines, clipping, duplication, or automatic motion; keep delayed hover and immediate keyboard tooltips.

Icons must normally be simple geometric line/pixel/diagram forms in blue: dot grids, dotted squares, nodes, brackets, concentric circles, sliders, crosses, `< />`, and Sprae’s three-dot motif. Official ecosystem favicons are the deliberate exception: keep their source colors, store them locally, and multiply-blend them into paper. Do not use glossy 3D icons or generic mixed icon sets.

Usage and reference sections should feel like executable documentation. Usage is one fixed 2×2 field on neutral gray with only a center cross—no selector or quadrant cards; each context has one syntax-highlighted dark block and normal-size supporting copy, wrapping without horizontal scrolling. Reference is one titleless deep-navy `3/7` index with a single full-height divider, stacked descriptors, and unboxed wrapping examples. Examples defaults to the right-side six-row list, offers a left-side variant, and lets its specimen follow actual source height. Comparison fixes Sprae and the selected alternative in two independent 50/50 plates, uses locally downloaded official favicons in the framework tabs, and places statistics on paper below each plate with no trailing note.

Introduce a cool light-gray editorial section later in the page as a tonal reset. Compose it like a catalog spread with a large statement such as **“Tiny reactivity, big possibilities”**, a dark code object, an oversized year/metric, and a concise manifesto line. Let a pale blue glow enter from one edge.

Copy should be factual, terse, anti-hype, and mechanism-oriented. Prefer lines such as **“Add reactivity. Not a regime.”**, **“Keep your HTML.”**, **“The markup stays yours.”**, **“HTML arrives. Bindings connect. Attributes leave.”**, and **“Small software survives by staying useful.”**

Do not use generic SaaS bento grids, glassmorphism, pill-heavy layouts, stock illustrations, shiny 3D icons, warm luxury palettes, rainbow syntax, excessive shadows, or repeated CTA buttons.

The page should feel like **a contemporary archival poster that happens to be executable documentation**.
