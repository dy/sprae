# Sprae Visual Direction

## Current implementation contract — reference-led polish

This section is authoritative for the landing page. The earlier brief below is retained as
historical design rationale, including the shader experiments; where it differs, follow
this contract and `index.html`, not the superseded layout recipes.

### Purpose

Sprae should feel like carefully finished, small software: understandable, useful in an
existing project, and free of unnecessary decisions. High-end quality comes from precise
type, coherent interactions, and working examples, not additional decoration.

Preserve the editorial archive identity: the `spræ` wordmark, three-dot mark, asymmetric
10-column composition, blue mist, cool paper, navy code plates, two-tone feature figures,
and quiet footer. Do not add page-wide rulers, measurement ticks, or new framing chrome.

### Reading order

Hero → Features / specifications / individual feature scroller → Usage → Reference →
Comparison → FAQ → Footer. Existing navigation anchors remain available. All directive
and modifier reference content remains on the page after Usage. The feature scroller
has no heading or outbound link.

### Hero

- Category statement: “Minimal reactivity for HTML/JSX.”
- Supporting text: “Keep your HTML. Add reactive behavior with :attributes—no build step
  or rewrite.” Set at 20px / 400, subordinate to the headline.
- One editable character counter: local `text`, a labelled textarea, and
  `text.length + ' characters'`. No regex, optional chaining, or reading-time formula in
  the first example. A brief caption invites visitors to edit the live text.
- The source editor wraps on small screens. Highlighted code and the textarea must share
  the exact font, padding, and line height so the caret tracks the displayed text.
- Mobile recomposes naturally rather than forcing a viewport-height opening.
- Retain the left-edge “NOT A FRAMEWORK” annotation and existing hero transition.

### Atmosphere

The latest screenshot references steer the page toward lighter paper, quieter display
type, and a more open lower half. Use `--paper: var(--gradient-paper)` (Bloom Field’s gray base), `--ground: #f8f8f6`, navy
text throughout: headings, prose, links, capability tags, and specification labels all
use `--ink`. Reserve contrasting colors for syntax and dark code surfaces. Retain
Geist / IBM Plex Sans / Monaspace Neon.
Section headings use 450 weight; the wordmark and feature figures keep their identity.

The entry uses the supplied [Bloom Field gradient by Celeste](https://21st.dev/@joinceleste/components/bloom-field-gradient)
as direct HTML/CSS: one positioned layer with the exact four radial-gradient centers,
stops, and alpha values, followed by the separate SVG grain layer. The complete background
recipe lives in `--bloom-field`; its legacy RGBA notation is deliberate, preserving the
source’s interpolation. Standalone screenshots match the supplied recipe pixel-for-pixel
at 1200×800 and 375×700. Reuse its palette:
`--gradient-paper: #e2e2e2`, `--gradient-blue: #1b9ffe`, `--gradient-cyan: #4ac9ff`.
The first 120px SVG noise tile uses frequency 0.9 / two octaves / opacity 0.5 with overlay
blending; the full-size pass is the supplied `assets/noise.png` tile (256px, repeated) at opacity 0.5 and overlay blending, so the grain on the bloom is the same texture as everywhere else. The four centres drift gently and independently through CSS
keyframes on registered custom properties (`@property`, periods 14–25s, each centre travelling
12–14% of the field), so the motion reads within a couple of seconds of looking; there is no script
loop. Each load starts the four animations at a random phase through a sprae `:style` on the field, so the opening composition differs every visit. Keep the initial centers and palette faithful to the supplied recipe. The keyframes stop
under reduced motion. No canvas, WebGL, JSX, or dependency is needed.
The source supplied by the user is authoritative; do not substitute an approximate mesh.

Keep the header free of a white veil. The entry fades into Features using the same
`--paper` base as the Bloom Field. There is no duplicate body gradient with a hard lower
edge. The existing page grain fades in only after the entry, avoiding a third grain pass
on the supplied component; there is no noise toggle: the bloom carries its own grain. The background displays even with JavaScript disabled.
Shader experiments stay in their separate files and are not loaded by the landing page.

`body { isolation: isolate }` is essential: negative-z background layers must paint above
the body canvas. Losing that rule exposes the fallback instead of the intended CSS gradient.
Do not repurpose that declaration when adjusting comparison or example grids.
The public page exposes the small grid toggle again, showing the shared ten-column
construction grid. Persist its state locally. Do not restore background experiment controls.
The corner paper fades reach upward at ±30°. Keep the hero transition rule above them
so it remains visible, with the hero source and edge label above the rule. Render the
fixed, pointer-transparent `.page-guides` element directly under the body so its ten
columns remain visible over every section when toggled.

### Specifications and claims

Use five facts: package size, dependencies, runtime memory, speed, and project age.
Use the shared display scale capped at `--fs-5` (48.832px), reduced from the earlier oversized figures: 11.6 with KiB/gzip, 0 with deps, 2 with × Alpine/speed,
+2 with ms first paint/vs vanilla, and 3 with +/years. There are no visible labels: the unit phrase
beside each figure carries the meaning, and the `dt` labels serve assistive technology only. A single-line unit (deps) sits on the numeral's baseline; two-line units centre on it. Every value is a number in the same type role. No inter-stat rules.
Phones keep all five, three per row, each sized to its content across the shell; never drop a stat by width. A 1px divider above the stats reuses the shared extended
`--rule-width`, `--rule-size`, and `--rule` tokens. Do not repeat build steps from the feature description.

- First paint: **+2 ms vs vanilla**, 82.7ms against 81.1ms with 1,000 rows, from the local js-framework-benchmark
  run (`webdriver-ts/results`, sprae 13.3.8 keyed against vanillajs-keyed), linking to the comparison page. Releases were
  retired as a fact: a count is not a benefit. Alpine-relative factors were retired too: the reader's yardstick is
  hand-written code, not another library. Re-run the benchmark and refresh both figures whenever the version changes.
- Size is **11.6 KiB gzip** for the current local UMD artifact (11,919 gzip bytes at this
  pass). Remeasure after rebuilding; do not confuse KiB with decimal kB.
- Dependencies: **0**. Build steps required by Sprae itself: **0**.
- Speed: **2× Alpine speed**, the ratio of geometric means of the nine CPU benchmarks from the same local
  js-framework-benchmark run (Alpine 3.14.7 76.4 ms, sprae 13.3.8 37.5 ms, vanilla 25.3 ms), linking to the comparison page. The CSP build is covered in the FAQ rather
  than as a stat, since a label is not a number.
- Age: **3+ years**, supported by the published release history.
- Remove the unsourced `1.23× vanilla` score and universal benchmark-win language. Link
  to benchmarks rather than quoting an unexplained score. The comparison displays line
  counts for its exact snippets and build requirements, not unversioned package sizes.
- “No virtual DOM” is accurate; “no reconciliation” is not. Object items reconcile by
  identity and primitives by position. Describe ordinary JavaScript state access and
  Preact-compatible signals without implying a runtime dependency on Preact.

### Typography and controls

Use Geist for display / navigation, IBM Plex Sans for prose and live controls, and
Monaspace Neon for source. Reuse seven type roles: `--body-font`, `--heading-font`,
`--label-font`, `--caption-font`, `--code-font`, `--inline-code-font`, and `--tab-font`.
Features and FAQ questions share the label role; all source surfaces share the code role.
Feature links use the same text-link treatment as usage and the footer: body size and weight (they inherit the paragraph's font, never the tab font), the shared link rule under the words only, and a trailing ↗ that sits outside the underline; the define-element link in the aspects carries the same arrow. Embedded demo
frames receive the resolved body and code roles from the page instead of defining fonts
independently. Nested `<code>` explicitly inherits the parent's font instead of the
browser's default monospace. Syntax colors are shared; mint means an evaluated directive
expression. JavaScript keywords, function calls, properties, numbers, and operators have
distinct token classes using the existing syntax palette. Highlighting must preserve
source text and multiline token context, and must escape HTML before adding markup.

All tabs share `.tabs` and `--tab-font` (500, 16px, display family). Usage, Reference,
and Comparison all use `.tabs--line`, one underline style for every strip, `--selection-rule: 3px`. That underline is a single ink (`.tabs__ink`) per strip that slides and resizes to the selected tab whenever the selection changes, positioned through `ink()` from sprae state (the selected tab looked up by the id the state names, and a `tick` on the strip re-running it on resize and font load). Hover is a second traveller, a ghost rule in the divider colour (`.tabs__ghost`, `--rule`) that slides to the hovered tab and fades out when the pointer leaves; it sits beneath the ink, so hovering the selected tab shows nothing new. A hovered tab's mark also turns to its true colour at 0.7 opacity (rest: desaturated at 0.6; selected: 0.85). No card, no background. The same `--surface` token is the light code pane in Comparison and the reference hover card; Reference sits on `--ground-2`, a tad darker than the ground, so the card reads. Use `--selection-rule: 2px`
for active underlines and selected outlines, separate from `--rule-size: 1px` dividers.
Reference retains its sticky section navigation without a divider below the tabs. Its kind tabs read count first: `20 Directives`, `20+ Modifiers`, the plus marking that key filters extend the list.
All tab groups have labelled panels, roving focus, arrow navigation, and Home / End.
Comparison labels remain visible on mobile; text-only tabs wrap as whole controls.

### Usage

- Desktop pairs a three-column introduction (“Usage”) with a seven-column
  setup panel. Hero and usage share `--rule-width`, `--rule-size: 1px`, and `--rule`.
  Lines extend half a column beyond each side of the ten-column shell, capped to
  preserve a 12px mobile gutter. Capability tags use thin outlined pills and the
  existing tab font; focus/hover emphasizes the border and updates an inline description.
  Mobile stacks the introduction above the tabs and code. The navy code plate
  uses the same `--code-inset` as the hero.
- Five named contexts: HTML, ESM, JSX, Markdown, Templates. Natural-width text tabs wrap
  as whole controls when necessary; never shrink text or clip the final choice to force
  a single row. The note dashes align with the line-number inset. Use `--usage-inset`
  for both; wherever the line-number gutter is hidden (tablets and phones), the source, the tabs, and the facts share one reduced `--sp-5` inset.
- Source is deliberately formatted with shorter lines and wraps in place; mobile hides
  the line-number gutter. Height follows content. Keep concise operational notes below.
- Copy feedback must reflect the clipboard result; expose a manual-copy instruction if
  the browser refuses access. Tooltip and code-panel focus must remain visible. Reserve
  space beside the first two source lines so the copy button cannot cover wrapped code.

### Examples and reference

The former capability tags and Examples share one native horizontal row that closes the
Usage section beneath its panel, on the same paper; it elaborates Usage and leads into Reference. There is no navigation entry or anchor for it yet: an Examples page may follow later, and until
then the strip carries no heading and no All examples link. Keep all 19 original capabilities as individual items, plus Templates: no virtual
DOM, computed values, no list keys, async expressions, mount hooks, automatic cleanup,
intersection, resize, portals, custom elements, refs, attribute spread, event chains,
debounce/throttle, pluggable signals, configuration, CSP, browser extensions, and types.

Each item is a FAQ-style title and a short paragraph. Add a few lines of code only where
useful, highlighted on the page ground. No demo panels, dark code boxes, fixed heights,
or enclosing cards. Reuse the existing label, body, code, and light syntax roles. Items
are narrower so several individual features are visible together.

The row starts at the content left edge and overflows behind the right viewport edge.
Native scroll padding ends the last item at the content right edge. Hide the scrollbar
while retaining native touch, trackpad, keyboard arrows, and Home/End. No snapping: it would fight the drift.
No clones, marquee, synthetic drag, auto-advance, or extra navigation controls.

Reference keeps the four-column index (two on tablet/mobile), light directive names and
descriptions, and sticky underline tabs. The index is four columns on desktop (three of `shell/4` less the gutter and one of `shell/4`, so the third column starts on column line 5) and three on tablets, with a rule a step (`--sp-5`) below the intro text, from the content's left edge to the right screen edge, well clear of the tabs, with 14px descriptions set 2px under the names; the preview dialog's hidden heading reads "Example" until an entry names it, never empty; the intro follows the active tab: one sentence each, for directives "An element can have multiple directives, initialized in order – `:if :each` is not the same as `:each :if`. Combined `:id:name="field"` sets both from one expression", for modifiers "Directives can have modifiers applied left to right – `:onkeydown.ctrl-s.prevent` key-gates then prevents the default then runs expression". The two should run the same number of lines; both are rendered in one grid cell with the inactive one invisible, so the block keeps the taller height and the rule below never moves when the tab changes. Comments in examples precede the line they describe, never trail it, so nothing wraps. Columns are separated by a `--sp-10` gap, and a pointer resting in the gap closes the preview, so one entry can be left without landing on its neighbour. The kind tabs use a plain space before their counts. Match the
[Project Showcase preview by Jatin Yadav](https://21st.dev/@jatin-yadav05/components/project-showcase):
a rounded, floating preview trails the cursor: its left edge 24px right of the pointer and its
bottom 32px above it, interpolated as the pointer moves, so it leads rightward instead of covering
the columns to its left. Near the right edge it keeps its width and shifts left instead. It is content-sized and never scrolls: when the room above the pointer is
short it sits below the pointer instead. Only the pinned (touch or keyboard) state may scroll. Every move glides, including after a content change: the new content is measured first, so the direction (above the pointer, else below) is settled before the move starts, and only the first open and the pinned placement are instant. Retain interpolation,
a 300ms fade/scale, and 260ms blurred content transitions. Every source swap (the preview, and the Usage and Comparison panels) crossfades through `swap()`: a ghost of the old markup blurs out (220ms) over the new markup blurring in (260ms), with no scaling, while the box height eases between the two (260ms). The tab's `:onclick` drives it, with the code element captured by `:ref`. Highlight the hovered tile with a white card only (`#fff`, lighter than the ground, never darker); its name carries no underline, since the moving underline belongs to tab strips. Do not append an arrow. Hover previews ignore pointer events, so they
do not obstruct the index; there is no dialog header. Code replaces the reference image
and uses a wider, content-sized dark surface. Keyboard focus, or a tap on touch screens, pins the example for reading, selection, and scrolling; a close control is available in that state. With a fine pointer a click does nothing extra: the hover preview is the whole interaction.
Clamp to viewport edges and support Escape, outside click, tab-change, and scroll dismissal.
The linked component source is locked; motion and styling are reproduced from its public
rendered preview. Reduced motion keeps previews immediate and stationary.

Use conventional section titles: Usage, Reference, Comparison, and FAQ. The aspects strip has no visible title.
Introductions pair the heading with practical context on desktop and stack on mobile.
Keep existing section IDs and keyboard tab behavior. Avoid slogan-style headings.

### Comparison

Use the same compact filter in vanilla JavaScript, Sprae, Alpine, Vue, React, and
Svelte. The intro asks "How much code that takes with other libraries?" and adds the one point the panels prove: the markup is the program, the `<li>` repeats itself, no wrapper template, no key, no mount call, no build. Each "no" must be visible in at least one panel opposite. Vanilla is selected initially. The alternative and Sprae sit side by side in
one joined light/dark code block with no gap, drag handle, or duplicate header bars.
Both retain line numbers using the shared source-row renderer. On phones the two halves
stack without a gap so the source stays readable.

Keep framework tabs above, actual line counts and build requirements below each snippet,
and no duplicate header bars. Preserve readable source and the explanation of bindings.

### FAQ and footer

Eight open answers form a two-column grid with fine dividers, navy questions and
body text. Merge project structure and component guidance into one answer; include honest
independent-project authorship and support information. Use no placeholder popularity
metrics, invented testimonials, or unqualified performance claims from the references.

The footer carries “Small software, kept useful.” with an offset project note, a sponsorship
link labelled “Sponsor Sprae,” and a compact navigation row. A soft blue wash returns at the lower left. All footer
navigation and support links retain visible focus and 44px tap height; the note and
navigation reflow on mobile. The footer mark uses a 24px box beside the shared label
type role. Separate MIT and the omkara with spacing, without a dot. The footer line sits on the ten-column grid: the mark at column 0, the links (Usage, Reference, FAQ, GitHub) one per column from line 4, where the note above starts, the licence at the right edge; below 48rem it stacks. The cells are exactly three grid columns wide with half-column gutters (`3 × shell/10`, gap `shell/20`), so they start on column lines 0, 3.5 and 7 at every width, tablets included; no per-cell nudges. The three proofs are never narrowed to quarters.5, 5, 7.5 (15rem on tablets and phones), 16px titles, 14px copy held to two lines, a tl;dr each: no repetition of a proof or another aspect, nothing obvious, optional code) drifts sideways on its own at 20px/s, turning around at the ends, and stands still while a pointer or keyboard focus rests on it (`drift(el)` from `:fx`, paused by `still` in the viewport scope; none under reduced motion); it fades out past the shell edges, so it reads as an index, not as a second row of features. Code in an aspect must not wrap at 15rem; an aspect may carry one text link where a companion project is the real answer (Custom elements → define-element), set in the aspect's own caption font. The strip scrolls sideways only: vertical overflow is hidden, so a wheel over it moves the page. The strip carries a visually hidden h2 "Aspects", so its h3s do not read as Usage subsections. Order the aspects by importance to someone deciding: the CSP build first with browser extensions as its use, server components (no `'use client'`), then fragments, event chains, async expressions, optional keys, pluggable signals; then modifiers (timing, key filters), lifecycle (mount, cleanup, refs, spread), custom directives; the state notes later (computed values, stores, untracked `_` props); composition and observers; configuration and types last. No virtual DOM is not an aspect: the Light & fast proof already says it. Bloom Field supplies the quiet
ambient motion. Keep hover underline and preview transitions on the existing duration
and easing tokens; reduced motion disables ambient drift and makes movement immediate.

### Ship checks

Check 320, 375, 414, 768, and desktop widths: all tabs reachable, no clipped source, shared
code font metrics, visible focus, no obstructing design controls, and no page overflow.
Exercise the counter, edited source, every usage context, feature coverage, tab
keyboards, scroller start/end alignment, grid toggle, reduced motion, and clipboard success / failure. Keep the
full test suite green. Update this contract when a future visual decision replaces it.

---

# Historical brief and experiment notes

The following sections record the original visual exploration. Their palette, provenance,
and experimental details remain useful references; their component prescriptions are
superseded by the current implementation contract above.

## 1. Design thesis

**Editorial archive poster × experimental institutional identity × developer documentation.**

The site should feel like a contemporary public-program / design-archive poster translated into a web interface: precise, typographic, quiet, technical, and slightly atmospheric.

Source corpus: the NID Archives Public Programs 2021–22 identity (*Experiments in Art and Technology: India 1960s & '70s*: A4 poster, Instagram square series, wide banner) and the 2024 Spræ poster adaptation of it. The system's proof is that the same small kit survives every format.

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

Think: an exhibition programme, research institute poster, catalog spread, or printed archive notice, adapted to a working developer site.

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

Near mist, paper may pick up a faint periwinkle/violet cast (the source posters sit on a lavender-gray ground). The cast stays cool: never warm gray, never cream.

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

Grain sits **on top of everything**, including mist, type, and code panel, so ink reads as printed into the paper rather than layered over it. Keep it monochrome and fine.

The mist recomposes freely from section to section, exactly as it shifts from poster to poster in the source series, while the signature marks (§6) repeat unchanged. Fixed marks, variable weather.

On screen, the wash is slow but visibly alive. Randomize pool position, scale, phase, and pace within bounded ranges on each load; drift pigment and wet-edge texture continuously rather than looping an obvious morph. Pigment should occupy about half the viewport or less at once, leaving a substantial paper opening. Freeze the field for `prefers-reduced-motion`.

The wash is **absolute over the opening composition**, never fixed to the browser. It stays solid down to the transition divider (`--wash-fade`, set from the measured divider position), then masks away by the hero's bottom edge (`--wash-height`), so Features always sits on plainer paper than the top, and the page grain arrives over that same span. The paper corner bands are centred on the divider, extending as far below it as above, with their own vertical fade, so each end of the divider finishes on paper on both sides and never on a wash edge. They live at page level (`.corner-bands`, `z-index: -1`, top from `--wash-fade`), above the wash and beneath every section's content, so they never cover the feature titles. It scrolls away with the opening composition.

Production compiles **only mode 7 (`spray`)**. `assets/shaders.js` contains that shader and its material trail only; it has no physical-smoke dependency. The landing page does not load the shader any more: the CSS-only Bloom Field derived from the supplied 21st.dev gradient preset is the hero wash. The reference composition uses four layered radial blooms on `#e2e2e2`: gray at `67.04% 45.93%`, blue at `35.47% 65.92%` and `48.33% 20.11%`, cyan at `80.81% 88.03%`. Reproduce the linked preset’s `grain: 100` with the supplied 256px bitmap as the Gradient field’s top layer (`assets/noise.png`, 50%, `overlay`), in addition to the quieter page-print grain. Do not add a second Gradient-only fractal layer. When Gradient is visible and motion is allowed, drive both CSS fields from one `requestAnimationFrame` loop. Use elapsed seconds `t`, `ph = t * 1.00`, `amt = 1.00`, `dir = 1`, and `spin = ph * dir`. Derive static `p` and `p2` phases once from seed `174074637`. Each frame adds `(sin(spin * 0.55 + p) - sin(p)) * 14 * amt` to each blob’s x and `(sin(spin * 0.43 + p2) - sin(p2)) * 14 * amt` to y. Keep floating-point positions unquantized. Freeze at phase zero under reduced motion and stop the loop while Shader is selected or the document is hidden. The Gradient-only **new** action recomposes the same four blooms within bounded regions and cross-fades between two animated CSS layers; it changes composition, never palette or shader payload. Keep the same corner overlays, height, and final `20svh` mask, and pause WebGL rendering while Gradient is selected. Every other shader remains exclusively in `design-variants/7-shaders.html`, whose laboratory retains the complete 1–11 switch.

Gallery modes **7 (`spray`) and 8 (`fog`)** must translate visibly over a five-to-ten-second observation: whole plumes/cells migrate while their internal texture circulates more slowly. Their color is restrained duotone, not monochrome and not rainbow; broad cyan/periwinkle and steel-blue/indigo regions move with their sources rather than through a screen-fixed gradient. Mode 7 is explicitly two persistent density layers, each with its own sources, fold, texture, and constant-speed drift; both colors exist before pointer input. Pointer matter is a third visual volume sampled at several radii: a broad blurred cyan atmosphere surrounds a denser blue core, with low-frequency billow and directional density variation preventing a flat interior. Density accumulates asymptotically and the held radius grows only modestly, so the center does not become a flat disk. On release, the simulation increases its diffusion radius while retaining matter for roughly three times longer: the mark visibly expands and softens before it fades.

The shader gallery keeps the stylized plume as mode 9 and adds **mode 11, `smoke-sim`**, as a separate physical study. Mode 11 is not a procedural cloud mask: it uses semi-Lagrangian velocity/density advection, buoyancy, vorticity confinement, divergence measurement, an iterative pressure solve, and pressure-gradient projection. Render only the resulting simulated density through the shared paper → pale blue → steel blue → indigo colormap; temperature may select the cyan accent. Noise may texture the paper or modulate the emitter, but must never invent the smoke silhouette. Pointer travel adds momentum; press-and-hold injects matter and heat. Under reduced motion, pre-settle once and then freeze.

---

## 5. Typography

Use a **clean geometric grotesk** with a wide weight axis (light ≈300 through bold ≈700+) and slightly technical detailing. Space Grotesk is the closest match to the source posters; Geist and Bricolage Grotesque are workable cuts.

Do not rely on serif typography.

### Two display registers

1. **The wordmark**: lowercase `spræ`, the `æ` ligature being the canonical poster form. The only lowercase display object on the page. The tridot mark, in the top bar and the footer, turns very slowly while hovered (one turn in 40s) and keeps its angle when the pointer leaves.
2. **Caps identity register**: ALL-CAPS bold stacks: the rotated strip, corner metadata, session-style titles. Set tight: line-height ≈ 0.95–1.05, tracking ≈ 0 (never letterspaced), left-aligned, hard-stacked. This governs caps at *display* scale. Caps set small, as annotation, take the opposite treatment: regular weight and open tracking, where the spacing is what makes 12px caps legible rather than a substitute for presence (see the root edge label, §6).

Everything else is sentence-case body or tiny mono annotation. Caps at display size are normal in this system; what stays sentence case are statements and body.

### Weight pairing

The core hierarchy device is **weight contrast at equal size**, not size change:

- bold caps title + light attribution beneath (`THE SOUND STUDIO` / `Paul Purgas`)
- light label + bold list (`Presenters:` → bold names, one per line)
- light paragraph with **bold inline facts**: dates, sizes, versions, URLs (“begins on **30-07-2021** … from **19:30 to 21:00 (IST)**”)
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

The recurring kit that makes an artifact recognizably part of the system. These repeat nearly unchanged across every format while composition and mist re-flow around them.

### Rotated identity strip

The brand carrier. A caps stack rotated 90° counter-clockwise (reads bottom→top), pinned to an outer grid edge. On the root hero, `NOT A FRAMEWORK` sits just above the transition divider at the right boundary of the final column:

- 2–3 hard-stacked lines, bold claim + light qualifier at the same size
  (source: `EXPERIMENTS IN ART AND TECHNOLOGY` bold / `INDIA 1960s & '70s` light;
  sprae: `THE SMALLEST, FASTEST WAY TO ADD REACTIVITY TO HTML.`)
- the root edge label is the annotation cut of the strip, not the display cut: one uniform regular weight (400) at `fs-xs`, tracked open to `0.167em` (2px at that size). It reads as a fine engraved caption beside the plate rather than a second headline competing with the wordmark
- the root label uses a short partial underline, never a full-height rule or leading em dash. Set it a clear `1.15em` off the letters, 2px thick and about `2.5em` long, aligned to the start of the phrase
- other identity strips may terminate with a dash in reading direction
- scales from display (in the hero it rivals the wordmark) down to caption (repeated on cards) with structure unchanged

### Corner metadata block

Top-left imprint: the year rotated 90° (`2024`) set flush beside a stacked bold caps program name (`SPRAE` / `REACTIVITY` / `FOR HTML`). Small, bold, tight: the institutional stamp of the page.

### Logo

Use the literal Unicode therefore mark `∴` as the Sprae logo. Do not redraw it as connected circles or substitute a custom SVG node. The mark may sit alone in navigation or precede `spræ` in compact signatures.

### The dash

A short thick rule (≈2–4px × 1.5–3em, square ends, ink color) used as punctuation, not decoration:

- standalone in open mist areas, marking “content lives here”
- above a paragraph or tiny label as its anchor
- rotated along with vertical strips
- the only list marker; tips and loose lists take dashes
- never in decorative rows, never full-width, never the ∴ tridot (the logo mark)

### Metric anatomy

Oversized numeral → rule beneath → small light multi-line caption below the rule (`~11kb` / rule / “Gzipped. Works with any backend or template.”). Stats sit side by side, top-aligned, on one row through tablets; below `48rem` all five remain, three per row. On the grid the strip is five cells of two columns each, so every stat starts on a column line. No visible labels.

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

**Edge-anchored composition**: type clusters hug the edges and corners of the canvas; the center stays airy: mist plus at most one paragraph. Blocks are separated by large voids and tied together by dashes and the shared grid, never by boxes.

The site should feel like a sequence of **editorial compositions**, not a stack of standard web sections.

The source identity survives A4, Instagram square, and wide banner by recomposing the same kit. Translate that: hero = the poster, feature/section cards = the square cuts, OG and social images = direct reuse. Signature marks stay fixed; mist and content re-flow.

### Alignment

Use a consistent 10-column desktop grid. The grid is construction logic, not decoration: its guides are hidden by default, fixed to the viewport when enabled, and remain visible over the full document through the persisted `grid` design-aid toggle.

Typical alignments:

- top nav: sparse across upper edge
- hero wordmark: slightly left of center
- supporting statement: offset to the right
- vertical annotation: right boundary of the final grid column, reading bottom→top, its foot just above the transition divider (physical `right`/`bottom` offsets: `inset-block-*` remaps under `vertical-rl`)
- code panel: centered, spanning columns 2.5–8.5; its inline padding is `--shell`/20 so code content begins and ends exactly on column lines 3 and 9
- features: built as an irregular composition immediately after the hero

---

## 8. Hero

The hero establishes the entire system.

### Components

- corner metadata block top-left: rotated year + stacked `SPRAE / REACTIVITY / FOR HTML`
- sparse navigation opposite it (Usage, Reference, FAQ, capitalized), as labels, not buttons, each with the shared link rule (`--link-rule`, currentColor at 28%: a faint 1px underline `0.3em` below the text that fills on hover with no transition, one token for every text link on the page: menu, feature links, Start, FAQ, footer; stat numerals are links without an underline), with a small mono version stamp beside the GitHub mark, whose glyph sits on the shell's right edge (the tap target overhangs)
- large `spræ` wordmark, preceded by a standalone dash
- concise bold statement such as:
  - **Minimal reactivity for HTML**
  - **Add reactivity to HTML with :attributes.**
- one short light explanatory paragraph
- rotated identity strip on the right edge of the final grid column, reading bottom→top, running alongside the code plate:
  - `THE SMALLEST, FASTEST WAY TO ADD REACTIVITY TO HTML.`
  - or `NOT A FRAMEWORK` set small, regular, and open-tracked
- metric pair set with the §6 anatomy (`~11kb`, `434 tests`)
- large dark code panel
- small “Live” status
- minimal interactive output
- every section intro is a two-column grid whose text column starts on column line 5; the Usage panel's edge sits on column line 4, the line where the third stat begins, so panel and strip share an edge
- the plate is not editable: it shows one highlighted specimen and its live result. The hero line is the hook, a water-cycle wordplay on microhydration: “Sprinkle :attributes on your HTML –” / “sprae evaporates them, hydrating the DOM tree” (verbatim, en dash, lowercase sprae, no final stop) It is always exactly two lines (one sentence per line, no wrapping above `48rem`) at `--fs-2`. Hovering the phrase plays the whole cycle through one `play` value and a `director()` effect in the hero scope: the attribute names light up (names only, never their values); then the attributes alone evaporate: each directive-and-value group (`.a`, emitted by the highlighter with its leading space inside the group, so a closed group leaves no gap before the bracket) loses its highlight and blurs, fades, and closes up over 0.8s while the tags stay put, and stays closed; then hydration: the frame's own markup replaces the source and only what Sprae produced (`.w`: the value attribute, the rendered text) condenses in, growing from zero width as it sharpens, and the phrase is typed (`typewrite()`, 70ms a character). Evaporate and hydrate are distinct steps: the evaporate word alone empties the tags and inserts nothing; the hydrate word alone evaporates first, then hydrates. The cycle runs on 1.4s, 3.2s marks; leaving reverses it, values blurring and shrinking away and attributes opening up in place. The whole source never blurs. Hovering one word plays only its step, and each hook word carries the active-style rule that grows from the left while its step runs. Leaving the phrase crossfades back to the source. Source is a block, not an inline box, so the crossfade ghost never shifts it. The source area has a fixed minimum height for its four lines and is excluded from the swap's height animation, so nothing above it ever moves; the specimen carries no aria-label, and the live frame is exactly four major dot rows tall so it ends on the grid. No hint text under the specimen

### Code panel

The code panel is the primary solid object on the page.

Use:

- opaque deep navy / near-black background
- very restrained rounding
- no heavy shadow
- cool syntax: cyan directive names, mint (`--accent-mint`, `#b0ecd0`) for the quoted expression bound to a directive, white for plain attribute strings and JS string literals, plain attribute names kept whole (`data-start`, `aria-busy`: the hyphen is never an operator), pale JS keywords, and muted tag names, visible text, comments, and punctuation. The mint carries meaning: it marks text sprae evaluates, so `data-prefix` and `data-start` values stay white because they are configuration, not directives
- boolean directives such as `:else` and the bare spread name in `:=""` receive the same cyan directive treatment as assigned directives
- every highlighted code surface uses the same `--code-size`, `--code-weight`, and `--code-leading`; token spans inherit a restrained 500 weight rather than becoming bold
- minimal chrome
- thin internal rule
- small `Live` indicator
- output controls integrated into the panel rather than styled as separate app UI
- all live frames share one low-specificity reset. It applies border-box sizing and inherited type, constrains fields and media, defines control states, and auto-fits specimen children
- specimen CSS defines composition only. The shared reset styles controls, type, spacing, states, and responsive fit
- live controls use the body family; monospace remains exclusive to code
- the `WORDS` textarea is capped at `36rem` and uses the same opaque navy fill as the plate, a soft 1px border, and no second focus ring
- place the counters 8px below the textarea; use 14px regular body text in normal case for numbers and labels
- sync the live frame’s inline padding to the source editor at load and resize; keep 16px above the textarea and a compact gap below the counters
- live output grid: same-size 1px dots every 8px, with a slightly stronger dot every 32px registered directly over a fine-grid dot
- example buttons use an opaque plate-colored fill so the grid never shows through them

It should feel like an archival display plate, not an IDE screenshot. The transition begins exactly at the live-demo half of the plate. The **Features section itself** owns the fill: pull it upward with a computed negative margin until its top edge equals that live-demo rule, then add the same amount back as top padding so feature content still begins below the hero. Do not use a hero pseudo-element or a second fill.

The divider is one desaturated gray-blue rule at 22% alpha spanning the full viewport width, edge to edge (the earlier edge gap is gone: rules on this page run to the screen). The rule above the stats enters from the left screen edge and stops on the shell's right edge; the rule that opens Usage enters from the left screen edge and stops on the shell's right edge, the same way; the aspects rule is full width; the reference intro carries a rule beneath its text from the content's left edge to the right screen edge. Its bottom edge, not its top edge, meets the Features boundary, so both pixels remain over the sprayable field rather than the paper cover. It ends sharply at both bounds, never feathers the line itself, and must retain `mix-blend-mode: multiply` so it stays present through pigment without becoming saturated. Keep the spray canvas’s exact final-`20svh` vertical mask. Above it, add two square paper overlays whose bottoms align precisely to the divider: a `45deg` wedge at lower left and a `-45deg` wedge at lower right. Each fades from opaque paper through `--paper-veil` to transparent before reaching its other edges, producing a visible soft corner vignette without dimming the center. Features adds a transparent-center paper gradient from both sides so the sprayed upper field never meets the lower ground at a hard edge. The plate stays above divider and ground.

---

## 9. Features / Three proofs

Features begins visually at the hero's live-demo rule, not after the hero. It is one full-width element pulled upward by `--feature-overlap`; equivalent top padding preserves the normal content position. Its background uses only a center-symmetric horizontal paper fade and a 64%-paper-to-solid vertical cover, revealing the actual spray beneath more quietly than before. Do not add a separate cyan radial haze or bias either side; left and right must resolve identically into flat `--paper` before the section ends.

There is no visible Features heading or layout selector. Three equal columns use dashed dividers and short copy. All three keep an identical measure: the gutters are a grid column gap, never cell padding, so the outer columns stay flush with the shell edges and the dashed rules ride the centre of each gap. Never pad the cells inline instead, which robs the middle column of one gutter of measure and makes the first proof look roomier than the rest; only a modest breath separates the grid from the hero, and the grid carries no bottom rule. The row is laid out as four quarters of the shell with three used: each cell is `shell/4` less a `--sp-8` gutter, so the three proofs start on column lines 0, 2.5 and 5 at every width, tablets included; no per-cell nudges. Below `48rem` each proof turns on its side: the figure owns the first grid column, scaled to fit it, and the copy starts on column line 1, at two thirds the figure height.

1. **HTML-first.** The copy states that Sprae adds reactivity through `:attributes` without a build or rewrite.
2. **Fast & small.** The copy names the published comparison set (ahead of Vue, React, Alpine) without implying an all-framework win, and links js-framework-benchmark.
3. **Open.** The copy states that `sprae()` returns plain live state and that signals remain Preact-compatible and swappable; links TC39 Signals.

Each cell opens with a small **two-tone printed figure** above its title; equal figure heights keep the three titles on one line. Flat geometric SVG in the blend-icon style: pale ink shapes (`--fig-dim`, ink at 17%) with solid ink accents, `mix-blend-mode: multiply`, square-ended strokes, no outlines. The three figures: `⟨/⟩` (pale angle brackets, ink slash) for HTML-first; a speedometer (a stroked 180° half-circle with flat ends and no overshoot, ink from the left end to the needle and pale past it, with a gap in the arc at the needle; the needle stops short of the arc; ink pivot; no edge marks) for Fast & small; four open walls (pale corner brackets of a square, each wall open in the middle) around a small solid ink dot for Open. ~64px tall, drawn in a shared 72×64 viewBox.

The feature stage ends with the stat strip. The capability marquee and its tooltip tags are gone: the aspects strip (§Examples and reference) carries that material and closes the Usage section instead.

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

Usage should read more like documentation than marketing. Its only title is the rotated edge label `USAGE`, the same annotation cut as the hero's `NOT A FRAMEWORK`: pinned to the shell's left edge, hung from the tab line, reading bottom→top, with the partial underline sized to the word (`2.5rem`). The label is the section's `h2`, so the visible word is also the accessible name. Below `48rem` it lies down horizontally above the panel, flush with the shell edge. The section sits on the whiter ground (`--ground`); the section itself is the selected panel. One dark navy code block is the only strong surface inside it.

The tab strip closes the Features paper: a full-bleed `--paper` band carries the tabs (HTML, ESM, JSX, Markdown, Templates, each with the same 14px dimmed mark as the comparison tabs: HTML5, JS, Next, a monochrome Markdown mark, a monochrome braces mark) as a `.tabs--line` strip. The tab labels, the code gutter's line numbers, and the fact dashes below the block all start on one inset (`--usage-inset`), so the strip, the block, and the notes read as one left-aligned column. The intro is one paragraph naming the four builds on four lines (line breaks, not a list), each filename a link to its unpkg file, in these words: "`sprae.umd.js` – CDN build. `sprae.js` – ES module for manual init. `sprae-csp.umd.js` – no-eval CSP build. `sprae-preact.umd.js` – preact-signals build." Each tab's facts are one-clause tl;drs of what that context adds: HTML, the two script-tag attributes ("`data-start` auto-starts on the document or selected element, and keeps watching it for nodes added or removed to autoinit." "`data-prefix` changes the directives prefix." and "`window.sprae` is exposed: `sprae(el, state)` inits by hand, `sprae.start(el)` autoinits and watches."); ESM, init by hand (`sprae(el, state)`, `sprae.start(el)` to watch); JSX, no `'use client'` and no colon; Markdown, MDX and sanitizers reject a colon; Templates, any engine and any prefix. Use the word autoinit, never 'bind' or bare 'init'. Facts under each tab say only what is specific to that context, and never repeat a note the aspects already make. Code samples keep short statements on one line rather than wrapping attributes. The panel grid is `7/3`: tabs span the full row, the description with two or three dash-led facts and the code block take the left track, and the measured spec list sits in the right track, starting on the height of the first content line. Spec rows are set in the body family (never monospace), values in tabular figures. Code is one wrapping syntax-highlighted block with a quiet line-number gutter and copy control. Description and facts share the same 16px body size. Facts explain operational details that are otherwise invisible. Keep every fact to one clause, a tl;dr, never a sentence with a because.

Below `40rem`, stack the panel copy above the complete framed code component. Tab labels stay on one line. Hide the line-number gutter at this width so source retains useful measure. Code wraps in place (`pre-wrap` plus anywhere wrapping): neither the block nor the page may gain a horizontal scrollbar.

---

## 12. Directives / reference

Reference has **no visible “Reference” heading**: the section sits on the whiter ground, and the list lives inside one deep-navy container, rounded except its top-left corner, with the plate shadow. The Directives / Modifiers tabs are sharp-cornered, sit outside and flush on top of the container on the ground, and the active tab shares the navy fill with light text. Keep the tabs sticky at the viewport top on an opaque ground background while the long list scrolls.

Each row uses a true `3/7` split. The left column stacks a compact 16px mono name and a one-line 3–6 word description, nothing else: no tips, hints, or footnotes. Anything a tip would have said either belongs in the description or is shown as one more example line (an alias such as `.outside`, a variant such as `.debounce-300-immediate`, sibling key filters such as `.esc` and `.ctrl-s`). The right column prints curated README cases directly on the section ground, **trimmed to the canonical forms**: one form per distinct capability, alternates only where they teach something the first form cannot (`:each` shows item, index, and object forms; `:if / :else` is one three-line chain; `:on<a>..on<b>` is its own entry rather than a comment under `:on<event>`; `:mount`, `:intersect`, and `:portal` show a single case each). No padding entries, no exhaustive per-directive galleries. Source uses `pre-wrap` and anywhere wrapping; no nested fill, border, radius, ellipsis, or horizontal scrolling.

Use **one short vertical divider per entry**, spanning only that entry’s content. Separate entries by 32px, not 48px. Never use one continuous divider through the gaps. Below `40rem`, stack each row and replace the vertical divider with a quiet horizontal boundary.

Expose 20 directive rows and 20 modifier rows. Combine `:if / :else` as one conditional entry and give the `:on<a>..on<b>` sequence its own; keep ordinary attributes and spread attributes separate, and retain the documented `.stop-immediate` and `.enter` modifiers. Timing entries are named by the bare modifier (`.debounce`, `.throttle`, `.delay`) and their examples show the interval forms (`100`, `100ms`, `1s`, `raf`, `idle`, `tick`) and `-immediate`; every entry shows two or three cases within six lines, comments included; the README keeps the exhaustive forms. Do not invent API merely to balance counts.

---

## 13. Examples band

Examples keep one Guide composition, list right (the position study concluded; its switch is removed): the specimen occupies columns 1–7 and the six-row example rail occupies columns 8–10. Below `48rem`, stack rail before specimen. The rail contains five substantial examples: sortable table, tag input, stopwatch, live filter, and async action. Each number and title shares a true baseline; neither uses tracking. Titles use the display family, one-line descriptions use the body family, and only source code is monospaced.

The selected specimen contains **only** the printed code and live output. Its height now follows the selected source naturally: remove fixed stage heights and vertical caps. Source wraps instead of scrolling horizontally; the iframe fills the resulting side-by-side height with an `18rem` floor. Below `64rem`, source and output stack with an `18rem` output row. One iframe runs the exact code printed.

The example rail has six equal 68px rows: five live specimens followed by **06 All examples →** as the final list item. Do not leave a separate CTA beneath the composition. Height changes between examples are now intentional because they reveal actual source length.

---

## 14. Comparison

Comparison is an explicit 50/50 pair. The two independent code plates have equal tracks, equal visual weight, full rounding, and a restrained gutter rather than joining into one wide object. Source wraps in place (`pre-wrap` plus anywhere wrapping): no horizontal scrollbars; only genuinely long implementations may scroll vertically inside the `38rem` cap. The pair follows the code-demo pattern: each plate carries its own top bar with a rule beneath. The left bar holds the framework tabs (Vanilla, Alpine, Vue, React, Svelte) as `.tabs--line` at caption size, each with a 14px mark that is desaturated and dimmed at rest and full on the selected tab; the right bar holds the `Sprae` label with the tridot mark. Bar contents are centred vertically with no reserved rule space, so the ink and the label's rule sit on the bar's border, and the bar keeps a fixed height: only the source area animates when a tab changes. Never use a select menu or embed the tabs in code chrome. Use the locally stored marks in `assets/` (`logo-js.svg` for Vanilla, `logo-alpine.png`, `logo-vue.svg`, `logo-react.png`, `logo-svelte.png`), multiply-blended. Nothing sits under the plates: no line counts, build notes, or runtime figures. Do not add a concluding explanatory line beneath the pair; benchmark and comparison links already exist elsewhere. Preserve the pair through `44rem`; below that, sequence Sprae label → Sprae plate → Sprae stats → framework tabs → competing plate → competing stats.

---

## 15. FAQ

Uncollapsed two-column question list, the second column starting on column line 5: every answer visible at once. Eight buyer's questions, never support questions, and never one the sections or aspects already answer (no Alpine comparison, no stack list, no CSP how-to: those live above). Answers are tl;drs of one or two sentences, no sponsorship link. In this order: why a library when AI writes the code (cheap to write, expensive to read; the program stays in the markup); is evaluating attributes safe (`new Function` with trusted markup; the CSP build without eval); what if the script fails to load (progressive enhancement: the HTML renders as written; `hidden` is the fallback, `:hidden` takes over); does it have components (no: `<template>` or define-element; no router, server rendering, or build either); who is it not for (apps that live in client state); how to debug an expression (plain JS; errors name element and expression; `sprae(el)` returns the state); production readiness; who maintains it, as two separate questions. Semibold questions, plain answers, links underlined. Rules run above every row except the first. No accordions, plus markers, or expanders.

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
- the rotated strip stays vertical beside the code plate through tablets; it lays down to a horizontal label only below `48rem`, where the plate takes the full shell and leaves it no side margin
- code panel becomes full-width
- Features hold three inline columns through tablets and stack to one only at `48rem`, each proof then reading as a row of figure beside copy; Usage stacks tabs → container → spec at `64rem`
- Examples collapses to rail-first at `48rem`; Reference retains its `3/7` split through tablets and stacks below `40rem`; Comparison remains side by side until `44rem`
- tables and code may scroll inside their own bounds, never the page
- keep generous whitespace

---

## 20. Reusable master prompt

Design a page for **Sprae**, a tiny HTML-native reactive JavaScript library.

The visual language is **an experimental design-archive/public-program poster translated into a developer website**: editorial, institutional, technical, quiet, precise, and slightly atmospheric.

Use a cool off-white/light-gray paper background (faint periwinkle cast near mist) covered by subtle monochrome grain that sits over everything, type included, so ink reads as printed. Introduce soft-focus cyan, cobalt, blue, and indigo mist that flows asymmetrically through the composition while leaving a substantial white opening. The mist must feel like diffused ink or blurred photography, not ordinary radial-gradient blobs. On screen it drifts continuously and randomizes bounded pool position, scale, phase, and pace per load; freeze it for reduced motion and keep its visible footprint to about half a viewport or less.

Use deep navy and cobalt typography set in a geometric grotesk with a wide weight axis (Space Grotesk character). Two display registers: the lowercase `spræ` wordmark, and tight ALL-CAPS bold stacks (line-height ≈1, tracking ≈0, never letterspaced) for display-scale caps: corner metadata and titles. Caps set small, as annotation, invert that: regular weight, open tracking. Hierarchy comes from weight pairing at equal size: bold caps title over light attribution, light label over bold list, light paragraphs with bold inline facts, plus tiny mono technical annotations. Statements and body stay sentence case.

Build the page on a strict editorial grid but keep the composition asymmetric and edge-anchored: type clusters hug corners and edges, the center stays airy, and blocks are tied together by short thick dashes, the system’s punctuation, rather than boxes. Avoid conventional centered SaaS sections.

The hero should include the corner metadata block (rotated year beside stacked bold caps `SPRAE / REACTIVITY / FOR HTML`), quiet text links opposite it, a very large `spræ` wordmark preceded by a standalone dash, the bold statement **“Minimal reactivity for HTML”** or **“Add reactivity to HTML with :attributes.”**, one short light explanation, `NOT A FRAMEWORK` rotated bottom→top just above the transition divider at the right boundary of the final grid column with a short partial underline, a metric pair set as numeral → rule → small caption, and a large dark navy live code panel. The code panel should be flat and archival rather than glossy: restrained corners, a restrained cyan shadow, cyan directives, mint directive expressions, white plain strings, muted markup/content, a small `Live` indicator, and an interactive output integrated into the panel. Give it one editable `WORDS` specimen. The textarea is capped at `36rem`, shares the plate’s opaque navy fill, uses a soft 1px border, and has no second focus ring. Word count, character count, and reading time sit 8px below it. Use the body family for live controls and reserve monospace for code. Set numbers and labels alike at 14px regular weight in normal case. Sync the live frame’s inline padding to the source editor at load and resize. Keep 16px above the textarea and a compact gap below the counters. Use one low-specificity frame reset. It applies border-box sizing and inherited type, constrains fields and media, defines control states, and auto-fits specimen children. Keep specimen CSS to composition. The live area uses same-size 1px dots on 8px and 32px grids, precisely registered, with plate-filled controls.

After the hero, let Features overlap upward to the live-demo rule and own the entire transition ground. Use the three-proof structure from §9: three title-aligned columns with dashed dividers, each opening on a small two-tone blend-style figure (`⟨/⟩`, speedometer, concentric circles) above its title. Follow them with the one-line capability marquee, edge-faded, in the body family. Keep all copy terse and avoid repeating what a graphic already says.

Icons must normally be simple geometric line/pixel/diagram forms in blue: dot grids, dotted squares, nodes, brackets, concentric circles, sliders, crosses, `< />`, and Sprae’s three-dot motif. Official ecosystem favicons are the deliberate exception: store them locally, keep their source colors, and multiply-blend them into paper. Do not use glossy 3D icons or generic mixed icon sets.

Usage and reference sections should feel like executable documentation. Usage is a tabbed documentation panel on neutral gray, titled only by the rotated `USAGE` edge label: five contexts, short operational facts, and one syntax-highlighted block per tab, with the measured spec list on the right. Reference is one titleless deep-navy `3/7` index with sticky kind tabs, per-entry dividers, one-line descriptions, no tips, and unboxed README cases. The Examples section defaults to the right-side six-row list, offers a left-side variant, and lets its specimen follow actual source height. Comparison fixes Sprae and the selected alternative in two independent 50/50 plates, uses locally downloaded official favicons in the framework tabs, and places statistics on paper below each plate with no trailing note.

Introduce a cool light-gray editorial section later in the page as a tonal reset. Compose it like a catalog spread with a large statement such as **“Tiny reactivity, big possibilities”**, a dark code object, an oversized year/metric, and a concise manifesto line. Let a pale blue glow enter from one edge.

Copy should be factual, terse, anti-hype, and mechanism-oriented. Prefer lines such as **“Add reactivity. Not a regime.”**, **“Keep your HTML.”**, **“The markup stays yours.”**, **“HTML arrives. Bindings connect. Attributes leave.”**, and **“Small software survives by staying useful.”**

Do not use generic SaaS bento grids, glassmorphism, pill-heavy layouts, stock illustrations, shiny 3D icons, warm luxury palettes, rainbow syntax, excessive shadows, or repeated CTA buttons.

The page should feel like **a contemporary archival poster that happens to be executable documentation**.


## Shipping notes

- The construction-grid toggle renders only with `?grid` in the URL or once it has been switched on (its state persists in localStorage); visitors never see it.
- Fonts: Geist (display), IBM Plex Sans (text), and Monaspace Neon (code) are all preloaded. Monaspace ships as a latin subset (basic latin, latin-1, general punctuation, arrows; 86 KiB from 359 KiB) with all three axes; re-subset before adding glyphs outside those ranges to code samples.
- `assets/` holds only what a page loads: the three fonts and their licences, the logos in use, the OG image, the grain texture, and the markdown layout's stylesheet and tokens. Design experiments (spray, watercolor, shaders, unused logos) are gone; look them up in history.
- The markdown pages (compare, alpine, csp, drops) render through `_layouts/default.html` with `assets/style.css` and `assets/tokens.css`, which now take the index fonts and ink and ground colours, the same topbar (mark, usage, reference, faq, drops, version, GitHub) and the same footer line, and no perimeter frame. Their content layout with the side table of contents stays.
- Search: the title uses the ASCII name "Sprae" (the ligature stays in the wordmark and as `alternateName`); the head carries a canonical link and a SoftwareSourceCode JSON-LD block; the Jekyll sitemap plugin lists every page; the footer holds one plain paragraph naming the category and the alternatives people search for (Alpine.js, petite-vue, CSP, browser extensions, JSX, Next.js server components, Markdown, server templates). The description stays as written.
- Hero reset: leaving the line condenses the hydrated values out in a quarter second and restores the attributes in .35s (a `restoring` phase), against .8s forward; re-entering during the restore starts evaporation at once.
