<div class="no-toc">

# Drops

<!-- ## Examples, recipes, patterns -->

### How much code it would take<br> with other frameworks?

</div>

<div class="drops" data-scope="{ tag: 'all' }">

<div class="drops-filter" markdown="0">
<button data-class="{active: tag === 'all'}" data-onclick="tag = 'all'">all</button>
<button data-class="{active: tag === 'interaction'}" data-onclick="tag = 'interaction'">interaction</button>
<button data-class="{active: tag === 'form'}" data-onclick="tag = 'form'">form</button>
<button data-class="{active: tag === 'data'}" data-onclick="tag = 'data'">data</button>
<button data-class="{active: tag === 'layout'}" data-onclick="tag = 'layout'">layout</button>
<button data-class="{active: tag === 'tool'}" data-onclick="tag = 'tool'">tool</button>
<button data-class="{active: tag === 'time'}" data-onclick="tag = 'time'">time</button>
</div>

<div class="drops-grid">


<div class="drop" data-hidden="tag !== 'all' && tag !== 'interaction'">

### Counter

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{ count: 0 }">
  <button :onclick="count++">
    Clicked <span :text="count">0</span> times
  </button>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ count: 0 }">
<button data-onclick="count++">Clicked <span data-text="count">0</span> times</button>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'form'">

### Temperature converter

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{
  c: 0, f: 32,
  setC(v) { c=v; f=c*9/5+32 },
  setF(v) { f=v; c=(f-32)*5/9 }
}">
  <input type="number" :value="c"
    :change="setC" /> °C =
  <input type="number" :value="f"
    :change="setF" /> °F
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ c: 0, f: 32, setC(v) { this.c = v; this.f = this.c * 9/5 + 32 }, setF(v) { this.f = v; this.c = (this.f - 32) * 5/9 } }">
<input type="number" data-value="c" data-change="setC" style="width:5em" /> <span>°C =</span>
<input type="number" data-value="f" data-change="setF" style="width:5em" /> <span>°F</span>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'form'">

### Flight booker

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{
  mode: 'one-way',
  go: '2025-06-01',
  back: '2025-06-15',
  setMode(v) { mode = v },
  setGo(v) { go = v },
  setBack(v) { back = v },
  get ok() {
    return mode === 'one-way'
      || back >= go }
}">
  <select :value="mode"
    :change="setMode">
    <option value="one-way">One-way</option>
    <option value="return">Return</option>
  </select>
  <input type="date" :value="go"
    :change="setGo" />
  <input type="date" :value="back"
    :change="setBack"
    :disabled="mode==='one-way'" />
  <button :disabled="!ok">Book</button>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ mode: 'one-way', go: '2025-06-01', back: '2025-06-15', ok: true, check() { this.ok = this.mode === 'one-way' || String(this.go).localeCompare(this.back) !== 1 }, setMode(v) { this.mode = v; this.check() }, setGo(v) { this.go = v; this.check() }, setBack(v) { this.back = v; this.check() } }">
<select data-value="mode" data-change="setMode" style="width:100%"><option value="one-way">One-way</option><option value="return">Return</option></select>
<input type="date" data-value="go" data-change="setGo" style="width:100%" />
<input type="date" data-value="back" data-change="setBack" data-disabled="mode === 'one-way'" style="width:100%" />
<button data-disabled="!ok" data-onclick="alert(mode + ': ' + go + (mode === 'return' ? ' / ' + back : ''))">Book</button>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'interaction'">

### Timer

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{ max: 15, elapsed: 0,
  setMax(v) { this.max = v } }"
  :fx="() => {
    let id = setInterval(
      () => elapsed < max
        && elapsed++, 1000)
    return () => clearInterval(id)
  }">
  <progress :value="elapsed" :max="max">
  </progress>
  <p><span :text="elapsed">0</span>
    / <span :text="max"></span>s</p>
  <input type="range" :value="max"
    :change="setMax" min="1" max="60" />
  <button :onclick="elapsed=0">Reset</button>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ max: 15, elapsed: 0, _id: 0, setMax(v) { this.max = v }, tick() { this.elapsed = Math.min(this.elapsed + 1, this.max) } }" data-fx="clearInterval(_id); _id = setInterval(tick, 1000)">
<progress data-value="elapsed" data-max="max" style="width:100%"></progress>
<p><span data-text="elapsed">0</span> / <span data-text="max"></span>s</p>
<input type="range" data-value="max" data-change="setMax" min="1" max="60" style="width:100%" data-style="{'--fill': (max - 1) / 59 * 100 + '%'}" />
<button data-onclick="elapsed = 0" style="margin-top:var(--sp-2)">Reset</button>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'data'">

### CRUD

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{
  items: ['Hans','Claus','Karl'],
  sel: 0, name: '', filter: '',
  setFilter(v) { filter = v },
  pick(v) { sel=v; name=items[v] },
  setName(v) { name = v },
  match(n) { return n.toLowerCase()
    .includes(filter.toLowerCase()) },
  add() { items.push(name); name='' },
  upd() { items[sel] = name },
  del() { items.splice(sel,1);
    sel=Math.min(sel,items.length-1) }
}">
  <input :value="filter"
    :change="setFilter" />
  <select size="4" :value="sel"
    :change="pick">
    <option :each="n,i in items"
      :if="match(n)" :value="i"
      :text="n"></option>
  </select>
  <input :value="name" :change="setName"/>
  <button :onclick="add()">Create</button>
  <button :onclick="upd()">Update</button>
  <button :onclick="del()">Delete</button>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ items: ['Hans','Claus','Karl'], sel: 0, name: '', filter: '', setFilter(v) { this.filter = v }, pick(v) { this.sel = v; this.name = this.items[v] }, setName(v) { this.name = v }, match(n) { return n.toLowerCase().includes(filter.toLowerCase()) }, add() { this.items.push(this.name); this.name = '' }, upd() { this.items[this.sel] = this.name }, del() { this.items.splice(this.sel, 1); this.sel = Math.min(this.sel, this.items.length - 1) } }">
<input data-value="filter" data-change="setFilter" placeholder="Filter..." style="width:100%;" />
<select size="4" data-value="sel" data-change="pick" style="width:100%;padding:var(--sp-2)">
<option data-each="n, i in items" data-if="match(n)" data-value="i" data-text="n"></option>
</select>
<input data-value="name" data-change="setName" placeholder="Name" style="width:100%" />
<div style="display:flex;gap:var(--sp-2);margin-top:var(--sp-2)">
<button data-onclick="add()">Create</button>
<button data-onclick="upd()">Update</button>
<button data-onclick="del()">Delete</button>
</div>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'interaction'">

### Tabs

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{ tab: 'one' }">
  <button :class="{active: tab==='one'}"
    :onclick="tab='one'">One</button>
  <button :class="{active: tab==='two'}"
    :onclick="tab='two'">Two</button>
  <div :if="tab==='one'">First.</div>
  <div :else>Second.</div>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ tab: 'one' }">
<div class="drop-tabs" markdown="0"><button data-class="{active: tab === 'one'}" data-onclick="tab = 'one'">One</button><button data-class="{active: tab === 'two'}" data-onclick="tab = 'two'">Two</button><button data-class="{active: tab === 'three'}" data-onclick="tab = 'three'">Three</button></div>
<p data-if="tab === 'one'" style="margin-top:var(--sp-3)">First tab content.</p>
<p data-if="tab === 'two'" style="margin-top:var(--sp-3)">Second tab content.</p>
<p data-if="tab === 'three'" style="margin-top:var(--sp-3)">Third tab content.</p>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'interaction'">

### Modal

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{ open: false }">
  <button :onclick="open=true">Open</button>
  <dialog :if="open"
    :onclick.self="open=false"
    :onkeydown.window.escape="open=false">
    <h2>Hello</h2>
    <p>Content here.</p>
    <button :onclick="open=false">Close</button>
  </dialog>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ open: false }">
<button data-onclick="open = true">Open Modal</button>
<div data-if="open" class="drop-modal-overlay" data-onclick.self="open = false" data-onkeydown.window.escape="open = false">
<div class="drop-modal">
<b style="display:block;margin-bottom:var(--sp-3);font-size:var(--text-lg)">Hello</b>
<p style="margin-bottom:var(--sp-4)">Content here.</p>
<button data-onclick="open = false">Close</button>
</div>
</div>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'interaction'">

### Accordion

<div class="drop-row">
<div class="drop-code">

```html
<div :each="item, i in items"
  :scope="{ open: i===0 }">
  <button :onclick="open=!open"
    :text="item.title"></button>
  <div :if="open" :text="item.body"></div>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ items: [{title:'What is sprae?', body:'A 5kb reactive library for HTML.'}, {title:'Build step needed?', body:'No. One script tag is enough.'}, {title:'Production-ready?', body:'Yes. 3+ years, 13 major versions.'}] }">
<div data-each="item, i in items" data-scope="{ open: i === 0 }">
<button data-onclick="open = !open" class="drop-accordion-btn"><span data-text="item.title"></span> <span data-text="open ? '−' : '+'" style="float:right"></span></button>
<div data-hidden="!open" class="drop-accordion-body" data-text="item.body"></div>
</div>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'interaction'">

### Dropdown

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{ open: false }">
  <button :onclick="open=!open">Menu ▾</button>
  <ul :if="open">
    <li :onclick="open=false">Edit</li>
    <li :onclick="open=false">Copy</li>
    <li :onclick="open=false">Delete</li>
  </ul>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ open: false }">
<div style="position:relative;display:inline-block">
<button data-onclick="open = !open">Menu ▾</button>
<div data-if="open" class="drop-menu">
<a data-onclick="open = false">Edit</a>
<a data-onclick="open = false">Copy</a>
<a data-onclick="open = false">Delete</a>
</div>
</div>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'form'">

### Checkbox group

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{
  sel: ['Apple','Cherry'],
  all: ['Apple','Banana','Cherry'],
  has(f) { return sel.includes(f) },
  flip(f,on) { on ? sel.push(f)
    : sel.splice(sel.indexOf(f),1) }
}">
  <label :each="f in all">
    <input type="checkbox" :value="has(f)"
      :onchange="e=>flip(f,e.target.checked)"/>
    <span :text="f"></span>
  </label>
  <p>: <b :text="sel.join(', ')"></b></p>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ sel: ['Apple','Cherry'], all: ['Apple','Banana','Cherry'], has(f) { return sel.includes(f) }, flip(f, on) { on ? sel.push(f) : sel.splice(sel.indexOf(f), 1) } }">
<label data-each="f in all" class="drop-check">
<input type="checkbox" data-value="has(f)" data-onchange="e => flip(f, e.target.checked)" />
<span data-text="f"></span>
</label>
<p style="margin-top:var(--sp-3)">Selected: <b data-text="sel.join(', ') || 'none'"></b></p>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'layout'">

### Responsive grid

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{ cols: 3 }"
  :resize="({width}) => cols =
    Math.max(1,Math.floor(width/120))">
  <div :style="{ display:'grid',
    gridTemplateColumns:
      'repeat('+cols+',1fr)' }">
    <div :each="n in 6" :text="n"></div>
  </div>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ cols: 3, fit(e) { this.cols = Math.max(1, Math.floor(e.width / 120)) } }" data-resize="fit">
<div data-style="{ display:'grid', 'grid-template-columns': 'repeat(' + cols + ', 1fr)', gap: 'var(--sp-2)' }">
<div data-each="n in 6" class="drop-grid-cell" data-text="n"></div>
</div>
<div data-text="cols + ' columns'" style="margin-top:var(--sp-2)"></div>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'interaction'">

### Dark mode

<div class="drop-row">
<div class="drop-code">

```html
<button :scope="{ dark: false }"
  :onclick="dark = !dark"
  :fx="document.documentElement.style
    .colorScheme = dark ? 'dark' : 'light'"
  :text="dark ? '☀️ Light' : '🌙 Dark'">
</button>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ dark: false }">
<button data-onclick="dark = !dark" data-fx="document.documentElement.style.colorScheme = dark ? 'dark' : 'light'" data-text="dark ? '☀️ Light' : '🌙 Dark'">🌙 Dark</button>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'interaction'">

### Accent color

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{ h: 262 }">
  <button :onclick="h=262">Blue</button>
  <button :onclick="h=180">Teal</button>
  <button :onclick="h=0">Rose</button>
  <button :onclick="h=80">Amber</button>
  <div :style.document="{
    '--accent-h': h }"></div>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ colors: [{name:'Blue',h:262},{name:'Teal',h:180},{name:'Rose',h:0},{name:'Amber',h:80}], pick(h) { document.documentElement.style.setProperty('--accent-h', h) } }">
<button data-each="c in colors" data-onclick="pick(c.h)" data-text="c.name" data-style="{ '--btn-bg': 'oklch(0.40 0.20 ' + c.h + ')' }"></button>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'data'">

### Sortable table

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{
  rows: [
    {name:'Alice', age:32},
    {name:'Bob', age:25},
    {name:'Carol', age:41}],
  col: 'name', asc: true,
  sort(c) {
    if (col===c) asc=!asc
    else { col=c; asc=true }
    rows.sort((a,b) => asc
      ? (a[col]>b[col]?1:-1)
      : (a[col]<b[col]?1:-1))
  }
}">
  <table>
    <tr>
      <th :onclick="sort('name')">Name</th>
      <th :onclick="sort('age')">Age</th>
    </tr>
    <tr :each="r in rows">
      <td :text="r.name"></td>
      <td :text="r.age"></td>
    </tr>
  </table>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ rows: [{name:'Alice',age:32},{name:'Bob',age:25},{name:'Carol',age:41}], col: 'name', asc: true, sort(c) { if (this.col===c) this.asc=!this.asc; else { this.col=c; this.asc=true }; let a=this.asc, k=this.col; this.rows.sort(function(x,y) { let r = String(x[k]).localeCompare(String(y[k]), undefined, {numeric:true}); return a ? r : -r }) } }" markdown="0">
<table class="drop-table">
<tr>
<th data-onclick="sort('name')">Name <span data-text="col==='name' ? (asc ? '↑' : '↓') : ''"></span></th>
<th data-onclick="sort('age')">Age <span data-text="col==='age' ? (asc ? '↑' : '↓') : ''"></span></th>
</tr>
<tr data-each="r in rows">
<td data-text="r.name"></td>
<td data-text="r.age"></td>
</tr>
</table>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'tool'">

### Color converter

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{
  hex: '#1548c1',
  r:21, g:72, b:193,
  setHex(v) {
    hex = v;
    let n = parseInt(v.slice(1), 16);
    r=n>>16; g=n>>8&255; b=n&255
  },
  setRGB() {
    hex = '#' + [r,g,b]
     .map(v => v.toString(16)
     .padStart(2,'0')).join('')
  }
}">
  <input :value="hex" :change="setHex" />
  <div :style="{background: hex,
    width:'3em', height:'3em'}"></div>
  <label>R <input type="range"
    :value="r" :change="v => {r=v; setRGB()}"
    min="0" max="255" /></label>
  <label>G <input type="range"
    :value="g" :change="v => {g=v; setRGB()}"
    min="0" max="255" /></label>
  <label>B <input type="range"
    :value="b" :change="v => {b=v; setRGB()}"
    min="0" max="255" /></label>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ hex: '#1548c1', r: 21, g: 72, b: 193, parse(s) { var c = s.match(/\w\w/g).map(function(x){return parseInt(x,16)}); this.r = c[0]; this.g = c[1]; this.b = c[2] }, setHex(v) { this.hex = v; this.parse(v) }, setR(v) { this.r = v; this.upd() }, setG(v) { this.g = v; this.upd() }, setB(v) { this.b = v; this.upd() }, upd() { this.hex = '#' + [this.r, this.g, this.b].map(function(v) { return v.toString(16).padStart(2, '0') }).join('') } }">
<div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-3)">
<input data-value="hex" data-change="setHex" style="width:7em;font-family:var(--font-mono)" />
<div data-style="{ background: hex }" style="width:3em;height:3em;border:var(--border);flex-shrink:0"></div>
</div>
<label style="display:flex;align-items:center;gap:var(--sp-2)">R <input type="range" data-value="r" data-change="setR" min="0" max="255" style="flex:1" data-style="{'--fill': r / 255 * 100 + '%'}" /></label>
<label style="display:flex;align-items:center;gap:var(--sp-2)">G <input type="range" data-value="g" data-change="setG" min="0" max="255" style="flex:1" data-style="{'--fill': g / 255 * 100 + '%'}" /></label>
<label style="display:flex;align-items:center;gap:var(--sp-2)">B <input type="range" data-value="b" data-change="setB" min="0" max="255" style="flex:1" data-style="{'--fill': b / 255 * 100 + '%'}" /></label>
<p style="margin-top:var(--sp-2);font-family:var(--font-mono);font-size:var(--text-sm)">rgb(<span data-text="r"></span>, <span data-text="g"></span>, <span data-text="b"></span>)</p>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'tool'">

### Tip calculator

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{
  bill: 50, pct: 15, split: 2,
  setPct(v) { pct = v },
  setSplit(v) { split = v },
  setBill(v) { bill = v },
  get tip() { return bill*pct/100 },
  get total() { return bill+tip },
  get each() { return total / split }
}">
  <input type="number" :value="bill"
    :change="setBill" />
  <input type="range" :value="pct"
    :change="setPct" min="0" max="50" />
  <span :text="pct + '%'"></span>
  <input type="number" :value="split"
    :change="setSplit" min="1" />
  <b>Tip: $<span :text="tip.toFixed(2)"></span>
   · Each: $<span :text="each.toFixed(2)">
  </span></b>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ bill: 50, pct: 15, split: 2, setBill(v) { this.bill = v }, setPct(v) { this.pct = v }, setSplit(v) { this.split = v }, get tip() { return this.bill * this.pct / 100 }, get total() { return this.bill + this.tip }, get each() { return this.total / this.split } }">
<label style="display:flex;align-items:center;gap:var(--sp-2)">Bill $ <input type="number" data-value="bill" data-change="setBill" min="0" style="width:6em" /></label>
<label style="display:flex;align-items:center;gap:var(--sp-2);margin-top:var(--sp-2)">Tip <input type="range" data-value="pct" data-change="setPct" min="0" max="50" style="flex:1" data-style="{'--fill': pct / 50 * 100 + '%'}" /> <span data-text="pct + '%'" style="width:3em"></span></label>
<label style="display:flex;align-items:center;gap:var(--sp-2);margin-top:var(--sp-2)">Split <input type="number" data-value="split" data-change="setSplit" min="1" max="20" style="width:4em" /></label>
<div style="margin-top:var(--sp-3);font-weight:bold">Tip: $<span data-text="tip.toFixed(2)"></span> · Each: $<span data-text="each.toFixed(2)"></span></div>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'tool'">

### Word counter

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{ txt: '', set(v){txt=v} }">
  <textarea :value="txt"
    :change="set" rows="4"></textarea>
  <p><span :text="txt.trim()
    ? txt.trim().split(/\s+/).length
    : 0"></span> words ·
  <span :text="txt.length"></span> chars</p>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ txt: '', set(v) { this.txt = v }, get words() { return this.txt.trim() ? this.txt.trim().split(/\s+/).length : 0 }, get lines() { return this.txt ? this.txt.split(/\n/).length : 0 } }">
<textarea data-value="txt" data-change="set" rows="4" placeholder="Type something..." style="width:100%;resize:vertical;padding:var(--sp-2);border:var(--border);font-family:var(--font-sans);font-size:var(--text-sm);color:var(--color-ink);background:var(--color-bg-alt)"></textarea>
<p style="margin-top:var(--sp-2);font-size:var(--text-sm)"><b data-text="words"></b> words · <b data-text="txt.length"></b> chars · <b data-text="lines"></b> lines</p>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'tool'">

### Unit converter

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{
  val: 1,
  from: 'km', to: 'mi',
  units: {km:1, mi:1.60934,
    m:0.001, ft:0.000305,
    yd:0.000914},
  setVal(v) { val = v },
  setFrom(v) { from = v },
  setTo(v) { to = v },
  get result() {
    return val*units[from]/units[to]
  }
}">
  <input type="number" :value="val"
    :change="setVal" />
  <select :value="from" :change="setFrom">
    <option :each="u in Object.keys(units)"
      :value="u" :text="u"></option>
  </select> =
  <b :text="result.toFixed(4)"></b>
  <select :value="to" :change="setTo">
    <option :each="u in Object.keys(units)"
      :value="u" :text="u"></option>
  </select>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ val: 1, from: 'km', to: 'mi', units: {km:1, mi:1.60934, m:0.001, ft:0.000305, yd:0.000914}, setVal(v) { this.val = v }, setFrom(v) { this.from = v }, setTo(v) { this.to = v }, get result() { return this.val * this.units[this.from] / this.units[this.to] } }">
<div style="display:flex;align-items:center;gap:var(--sp-2);flex-wrap:wrap">
<input type="number" data-value="val" data-change="setVal" min="0" style="width:6em" />
<select data-value="from" data-change="setFrom">
<option data-each="u in Object.keys(units)" data-value="u" data-text="u"></option>
</select>
<span>=</span>
<b data-text="result.toFixed(4)"></b>
<select data-value="to" data-change="setTo">
<option data-each="u in Object.keys(units)" data-value="u" data-text="u"></option>
</select>
</div>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'tool'">

### Currency converter

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{
  amt: 100,
  from: 'USD', to: 'EUR',
  rates: {USD:1, EUR:0.92,
    GBP:0.79, JPY:149.5,
    CAD:1.36, INR:83.1},
  setAmt(v) { amt = v },
  setFrom(v) { from = v },
  setTo(v) { to = v },
  get result() {
    return amt/rates[from]*rates[to]
  }
}">
  <input type="number" :value="amt"
    :change="setAmt" />
  <select :value="from" :change="setFrom">
    <option :each="c in Object.keys(rates)"
      :value="c" :text="c"></option>
  </select> =
  <b :text="result.toFixed(2)"></b>
  <select :value="to" :change="setTo">
    <option :each="c in Object.keys(rates)"
      :value="c" :text="c"></option>
  </select>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ amt: 100, from: 'USD', to: 'EUR', rates: {USD:1, EUR:0.92, GBP:0.79, JPY:149.5, CAD:1.36, INR:83.1}, setAmt(v) { this.amt = v }, setFrom(v) { this.from = v }, setTo(v) { this.to = v }, get result() { return this.amt / this.rates[this.from] * this.rates[this.to] } }">
<div style="display:flex;align-items:center;gap:var(--sp-2);flex-wrap:wrap">
<input type="number" data-value="amt" data-change="setAmt" min="0" style="width:6em" />
<select data-value="from" data-change="setFrom">
<option data-each="c in Object.keys(rates)" data-value="c" data-text="c"></option>
</select>
<span>=</span>
<b data-text="result.toFixed(2)"></b>
<select data-value="to" data-change="setTo">
<option data-each="c in Object.keys(rates)" data-value="c" data-text="c"></option>
</select>
</div>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'time'">

### Stopwatch

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{
  ms: 0, on: false, id: 0,
  start() {
    if (on) { clearInterval(id);
      on=false }
    else { on=true;
      id=setInterval(()=>ms+=10, 10) }
  },
  reset() { clearInterval(id);
    on=false; ms=0 },
  get t() {
    let m = Math.floor(ms/60000),
      s = Math.floor(ms%60000/1000),
      c = Math.floor(ms%1000/10);
    return [m,s,c].map(
      v => String(v).padStart(2,'0'))
      .join(':')
  }
}">
  <p :text="t"></p>
  <button :onclick="start()"
    :text="on ? 'Stop' : 'Start'"></button>
  <button :onclick="reset()">Reset</button>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ ms: 0, on: false, id: 0, start() { if (this.on) { clearInterval(this.id); this.on = false } else { this.on = true; var self = this; this.id = setInterval(function() { self.ms += 10 }, 10) } }, reset() { clearInterval(this.id); this.on = false; this.ms = 0 }, get t() { var m = Math.floor(this.ms / 60000), s = Math.floor(this.ms % 60000 / 1000), c = Math.floor(this.ms % 1000 / 10); return [m, s, c].map(function(v) { return String(v).padStart(2, '0') }).join(':') } }">
<p data-text="t" style="font-size:var(--text-xl);font-family:var(--font-mono);font-weight:bold;margin-bottom:var(--sp-3)">00:00:00</p>
<div style="display:flex;gap:var(--sp-2)">
<button data-onclick="start()" data-text="on ? 'Stop' : 'Start'">Start</button>
<button data-onclick="reset()">Reset</button>
</div>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'time'">

### Pomodoro

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{
  left: 1500, on: false, id: 0,
  work: 25, brk: 5, isWork: true,
  start() {
    if (on) { clearInterval(id);
      on = false }
    else { on = true;
      id = setInterval(() => {
        if (left-- <= 0) {
          isWork = !isWork;
          left = (isWork?work:brk)*60
        }
      }, 1000) }
  },
  reset() { clearInterval(id);
    on=false; isWork=true;
    left=work*60 },
  get mm() {
    return String(Math.floor(left/60))
      .padStart(2,'0') },
  get ss() {
    return String(left%60)
      .padStart(2,'0') }
}">
  <p :text="mm + ':' + ss"></p>
  <p :text="isWork ? 'Work' : 'Break'"></p>
  <button :onclick="start()"
    :text="on ? 'Pause' : 'Start'"></button>
  <button :onclick="reset()">Reset</button>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ left: 1500, on: false, id: 0, work: 25, brk: 5, isWork: true, start() { if (this.on) { clearInterval(this.id); this.on = false } else { this.on = true; var self = this; this.id = setInterval(function() { self.left--; if (!self.left) { self.isWork = !self.isWork; self.left = (self.isWork ? self.work : self.brk) * 60 } }, 1000) } }, reset() { clearInterval(this.id); this.on = false; this.isWork = true; this.left = this.work * 60 }, get mm() { return String(Math.floor(this.left / 60)).padStart(2, '0') }, get ss() { return String(this.left % 60).padStart(2, '0') } }">
<p data-text="mm + ':' + ss" style="font-size:var(--text-xl);font-family:var(--font-mono);font-weight:bold;margin-bottom:var(--sp-1)">25:00</p>
<p data-text="isWork ? 'Work' : 'Break'" style="font-size:var(--text-sm);margin-bottom:var(--sp-3)">Work</p>
<div style="display:flex;gap:var(--sp-2)">
<button data-onclick="start()" data-text="on ? 'Pause' : 'Start'">Start</button>
<button data-onclick="reset()">Reset</button>
</div>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'tool'">

### BMI calculator

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{
  h: 170, w: 70,
  setH(v) { h = v },
  setW(v) { w = v },
  get bmi() {
    return w / (h/100) ** 2 },
  get cat() {
    let b = bmi;
    return b < 18.5 ? 'Underweight'
      : b < 25 ? 'Normal'
      : b < 30 ? 'Overweight'
      : 'Obese'
  }
}">
  <label>Height
    <input type="range" :value="h"
      :change="setH"
      min="100" max="220" />
    <span :text="h + ' cm'"></span>
  </label>
  <label>Weight
    <input type="range" :value="w"
      :change="setW"
      min="30" max="200" />
    <span :text="w + ' kg'"></span>
  </label>
  <b :text="bmi.toFixed(1)+' — '+cat"></b>
</div>
```

</div>
{::nomarkdown}
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ h: 170, w: 70, setH(v) { this.h = v }, setW(v) { this.w = v }, get bmi() { return this.w / (this.h / 100) ** 2 }, get cat() { var b = this.bmi; return b < 18.5 ? 'Underweight' : b < 25 ? 'Normal' : b < 30 ? 'Overweight' : 'Obese' } }">
<label style="display:flex;align-items:center;gap:var(--sp-2)">Height <input type="range" data-value="h" data-change="setH" min="100" max="220" style="flex:1" data-style="{'--fill': (h - 100) / 120 * 100 + '%'}" /> <span data-text="h + ' cm'" style="width:5em"></span></label>
<label style="display:flex;align-items:center;gap:var(--sp-2);margin-top:var(--sp-2)">Weight <input type="range" data-value="w" data-change="setW" min="30" max="200" style="flex:1" data-style="{'--fill': (w - 30) / 170 * 100 + '%'}" /> <span data-text="w + ' kg'" style="width:5em"></span></label>
<div style="margin-top:var(--sp-3);font-weight:bold"><span data-text="bmi.toFixed(1)"></span> — <span data-text="cat"></span></div>
</div>
{:/nomarkdown}
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'tool'">

### Loan calculator

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{
  p: 200000, r: 5, y: 30,
  setP(v) { p=v }, setR(v) { r=v },
  setY(v) { y=v },
  get monthly() {
    let mr = r/100/12, n = y*12;
    return mr
      ? p*mr*(1+mr)**n/((1+mr)**n-1)
      : p/n
  },
  get total() { return monthly * y*12 }
}">
  <label>Amount $<input type="number"
    :value="p" :change="setP" /></label>
  <label>Rate <input type="range"
    :value="r" :change="setR"
    min="0" max="15" step="0.1" />
    <span :text="r + '%'"></span></label>
  <label>Years <input type="range"
    :value="y" :change="setY"
    min="1" max="30" /></label>
  <b>$<span :text="monthly.toFixed(2)">
  </span>/mo · $<span
    :text="total.toFixed(0)"></span> total
  </b>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ p: 200000, r: 5, y: 30, setP(v) { this.p = v }, setR(v) { this.r = v }, setY(v) { this.y = v }, get monthly() { var mr = this.r / 100 / 12, n = this.y * 12; return mr ? this.p * mr * Math.pow(1 + mr, n) / (Math.pow(1 + mr, n) - 1) : this.p / n }, get total() { return this.monthly * this.y * 12 } }">
<label style="display:flex;align-items:center;gap:var(--sp-2)">Amount $ <input type="number" data-value="p" data-change="setP" min="0" style="width:8em" /></label>
<label style="display:flex;align-items:center;gap:var(--sp-2);margin-top:var(--sp-2)">Rate <input type="range" data-value="r" data-change="setR" min="0" max="15" step="0.1" style="flex:1" data-style="{'--fill': r / 15 * 100 + '%'}" /> <span data-text="r + '%'" style="width:4em"></span></label>
<label style="display:flex;align-items:center;gap:var(--sp-2);margin-top:var(--sp-2)">Years <input type="range" data-value="y" data-change="setY" min="1" max="30" style="flex:1" data-style="{'--fill': (y - 1) / 29 * 100 + '%'}" /> <span data-text="y" style="width:2.5em"></span></label>
<div style="margin-top:var(--sp-3);font-weight:bold">$<span data-text="monthly.toFixed(2)"></span>/mo · $<span data-text="total.toFixed(0)"></span> total</div>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'tool'">

### JSON formatter

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{
  src: '{\"a\":1}', out: '',
  err: '',
  fmt(v) {
    src = v;
    try { out = JSON.stringify(
      JSON.parse(v), null, 2);
      err = '' }
    catch(e) { err = e.message }
  }
}">
  <textarea :value="src"
    :change="fmt" rows="3"></textarea>
  <p :if="err" :text="err"></p>
  <pre :if="!err" :text="out"></pre>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ src: '{&quot;name&quot;:&quot;sprae&quot;,&quot;version&quot;:13}', out: '', err: '', fmt(v) { this.src = v; try { this.out = JSON.stringify(JSON.parse(v), null, 2); this.err = '' } catch(e) { this.err = e.message } } }" data-fx="fmt(src)">
<textarea data-value="src" data-change="fmt" rows="3" style="width:100%;resize:vertical;padding:var(--sp-2);border:var(--border);font-family:var(--font-mono);font-size:var(--text-sm);color:var(--color-ink);background:var(--color-bg-alt)"></textarea>
<p data-if="err" data-text="err" style="color:red;margin-top:var(--sp-2);font-size:var(--text-sm)"></p>
<pre data-if="!err" data-text="out" style="margin-top:var(--sp-2);font-size:var(--text-xs)"></pre>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'interaction'">

### Phrase rotator

<div class="drop-row">
<div class="drop-code">

```html
<b :scope="{
  phrases: [
    'Signal-Powered Reactive Attributes Engine',
    'Structured Presentational Reactive Æsthetic',
    'Simple PRogressive Ænhancement'
  ],
  i: 0 }"
  :fx="() => {
    let id = setInterval(
      () => i = (i+1) % phrases.length,
      2000)
    return () => clearInterval(id) }"
  :text="phrases[i]">
</b>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ phrases: ['Signal-Powered Reactive Attributes Engine', 'Structured Presentational Reactive Æsthetic', 'Simple PRogressive Ænhancement',], i: 0, _id: 0, tick() { this.i = (this.i + 1) % this.phrases.length } }" data-fx="clearInterval(_id); _id = setInterval(tick, 2000)">
<b data-text="'sprae: ' + phrases[i]" style="font-size:var(--text-base)"></b>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'interaction'">

### Tooltip

<div class="drop-row">
<div class="drop-code">

```html
<span :scope="{ show: false }"
  :onmouseenter="show=true"
  :onmouseleave="show=false"
  style="position:relative">
  Hover me
  <span :if="show"
    style="position:absolute;
      bottom:100%; left:50%;
      transform:translateX(-50%)">
    Tooltip text
  </span>
</span>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ show: false }">
<span data-onmouseenter="show=true" data-onmouseleave="show=false" style="position:relative;cursor:default">
Hover me
<span data-if="show" style="position:absolute;bottom:calc(100% + var(--sp-1));left:50%;transform:translateX(-50%);background:var(--color-ink);color:var(--color-bg);padding:var(--sp-1) var(--sp-3);border-radius:var(--radius-sm);font-size:var(--text-sm);white-space:nowrap">Tooltip text</span>
</span>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'interaction'">

### Copy to clipboard

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{
  copied: false,
  copy() {
    navigator.clipboard.writeText(
      'npm i sprae')
    copied = true
    setTimeout(() => copied=false, 1500)
  }
}">
  <code>npm i sprae</code>
  <button :onclick="copy()"
    :text="copied ? '✓ Copied' : 'Copy'">
  </button>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ copied: false, copy() { navigator.clipboard.writeText('npm i sprae'); this.copied = true; var self = this; setTimeout(function() { self.copied = false }, 1500) } }">
<code style="margin-right:var(--sp-2)">npm i sprae</code>
<button data-onclick="copy()" data-text="copied ? '✓ Copied' : 'Copy'">Copy</button>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'interaction'">

### Toast

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{
  msgs: [],
  toast(text) {
    let m = { text, id: Date.now() }
    msgs.push(m)
    setTimeout(
      () => msgs.splice(
        msgs.indexOf(m), 1), 2500)
  }
}">
  <button :onclick="toast('Saved!')">
    Show toast</button>
  <div :each="m in msgs"
    :text="m.text"></div>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ msgs: [], toast(t) { var m = { text: t, id: Date.now() }; this.msgs.push(m); var self = this; setTimeout(function() { self.msgs.splice(self.msgs.indexOf(m), 1) }, 2500) } }">
<button data-onclick="toast('Saved!')">Show toast</button>
<div data-each="m in msgs" data-text="m.text" style="margin-top:var(--sp-2);padding:var(--sp-2) var(--sp-3);background:var(--color-ink);color:var(--color-bg);border-radius:var(--radius-sm);font-size:var(--text-sm)"></div>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'interaction'">

### Star rating

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{ rating: 0 }">
  <span :each="n in 5"
    :onclick="rating = n"
    :text="n <= rating ? '★' : '☆'"
    style="cursor:pointer;
      font-size:1.5em">
  </span>
  <span :text="rating + '/5'"></span>
</div>
```

</div>
{::nomarkdown}
<div class="drop-demo demo bg-graph-paper" data-scope="{ rating: 0 }">
<span data-each="n in 5" data-onclick="rating = n" data-text="n <= rating ? '★' : '☆'" style="cursor:pointer;font-size:1.5em;user-select:none"></span>
<span data-text="rating + ' / 5'" style="margin-left:var(--sp-2);font-size:var(--text-sm)"></span>
</div>
{:/nomarkdown}
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'form'">

### Tag input

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{
  tags: ['sprae','reactive'],
  val: '',
  setVal(v) { val = v },
  add(e) {
    if (e.key==='Enter' && val.trim()){
      tags.push(val.trim())
      val = '' }
  },
  rm(i) { tags.splice(i, 1) }
}">
  <span :each="t, i in tags"
    :onclick="rm(i)">
    <span :text="t"></span> ×
  </span>
  <input :value="val" :change="setVal"
    :onkeydown="add"
    placeholder="Add tag..." />
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ tags: ['sprae','reactive'], val: '', setVal(v) { this.val = v }, add(e) { if (e.key === 'Enter' && this.val.trim()) { this.tags.push(this.val.trim()); this.val = '' } }, rm(i) { this.tags.splice(i, 1) } }">
<span data-each="t, i in tags" data-onclick="rm(i)" style="display:inline-block;padding:var(--sp-1) var(--sp-2);margin:0 var(--sp-1) var(--sp-1) 0;background:var(--color-ink);color:var(--color-bg);border-radius:var(--radius-sm);font-size:var(--text-sm);cursor:pointer"><span data-text="t"></span> ×</span>
<input data-value="val" data-change="setVal" data-onkeydown="add" placeholder="Add tag..." style="width:8em;margin-top:var(--sp-1)" />
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'interaction'">

### Typewriter

<div class="drop-row">
<div class="drop-code">

```html
<span :scope="{
  text: 'Hello, sprae!',
  i: 0, dir: 1 }"
  :fx="() => {
    let id = setInterval(() => {
      i += dir
      if (i >= text.length) dir = -1
      if (i <= 0) dir = 1
    }, 100)
    return () => clearInterval(id) }"
  :text="text.slice(0, i) + '▌'">
</span>
```

</div>
{::nomarkdown}
<div class="drop-demo demo bg-graph-paper" data-scope="{ text: 'Hello, sprae!', i: 0, dir: 1, _id: 0, tick() { this.i += this.dir; if (this.i >= this.text.length) this.dir = -1; if (this.i <= 0) this.dir = 1 } }" data-fx="clearInterval(_id); _id = setInterval(tick, 100)">
<span data-text="text.slice(0, i) + '▌'" style="font-family:var(--font-mono)"></span>
</div>
{:/nomarkdown}
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'form'">

### Password strength

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{
  pw: '', setPw(v) { pw = v },
  get score() {
    let s = 0
    if (pw.length > 7) s++
    if (/[A-Z]/.test(pw)) s++
    if (/[0-9]/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    return s
  },
  get label() {
    return ['Weak','Fair',
      'Good','Strong'][score] || ''
  }
}">
  <input type="password" :value="pw"
    :change="setPw" />
  <progress :value="score" max="4">
  </progress>
  <span :text="label"></span>
</div>
```

</div>
{::nomarkdown}
<div class="drop-demo demo bg-graph-paper" data-scope="{ pw: '', setPw(v) { this.pw = v }, get score() { var s = 0; if (this.pw.length > 7) s++; if (/[A-Z]/.test(this.pw)) s++; if (/[0-9]/.test(this.pw)) s++; if (/[^A-Za-z0-9]/.test(this.pw)) s++; return s }, get label() { return ['Weak','Fair','Good','Strong'][this.score] || '' } }">
<input type="password" data-value="pw" data-change="setPw" placeholder="Enter password..." style="width:100%;margin-bottom:var(--sp-2)" />
<progress data-value="score" max="4" style="width:100%"></progress>
<span data-text="label" style="font-size:var(--text-sm);margin-top:var(--sp-1);display:block"></span>
</div>
{:/nomarkdown}
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'interaction'">

### Price toggle

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{
  yearly: false,
  get price() {
    return yearly ? '$96/yr' : '$12/mo'
  },
  get save() {
    return yearly ? 'Save 33%' : ''
  }
}">
  <button :onclick="yearly=!yearly"
    :text="yearly ? 'Yearly' : 'Monthly'">
  </button>
  <b :text="price"></b>
  <small :text="save"></small>
</div>
```

</div>
<div class="drop-demo demo bg-graph-paper" markdown="0" data-scope="{ yearly: false, get price() { return this.yearly ? '$96/yr' : '$12/mo' }, get save() { return this.yearly ? 'Save 33%' : '' } }">
<button data-onclick="yearly = !yearly" data-text="yearly ? '✓ Yearly' : 'Monthly'">Monthly</button>
<b data-text="price" style="margin-left:var(--sp-2);font-size:var(--text-lg)"></b>
<small data-text="save" style="margin-left:var(--sp-2);opacity:0.7"></small>
</div>
</div>
</div>


<div class="drop" data-hidden="tag !== 'all' && tag !== 'time'">

### Countdown

<div class="drop-row">
<div class="drop-code">

```html
<div :scope="{
  target: '2026-01-01',
  now: Date.now(),
  get diff() {
    return Math.max(0,
      new Date(target) - now) },
  get d() {
    return Math.floor(
      diff / 86400000) },
  get h() {
    return Math.floor(
      diff % 86400000 / 3600000) },
  get m() {
    return Math.floor(
      diff % 3600000 / 60000) }
}" :fx="() => {
  let id = setInterval(
    () => now = Date.now(), 1000)
  return () => clearInterval(id) }">
  <b :text="d+'d '+h+'h '+m+'m'"></b>
</div>
```

</div>
{::nomarkdown}
<div class="drop-demo demo bg-graph-paper" data-scope="{ target: '2027-01-01', now: Date.now(), _id: 0, tick() { this.now = Date.now() }, get diff() { return Math.max(0, new Date(this.target) - this.now) }, get d() { return Math.floor(this.diff / 86400000) }, get h() { return Math.floor(this.diff % 86400000 / 3600000) }, get m() { return Math.floor(this.diff % 3600000 / 60000) }, get s() { return Math.floor(this.diff % 60000 / 1000) } }" data-fx="clearInterval(_id); _id = setInterval(tick, 1000)">
<span style="font-family:var(--font-mono);font-size:var(--text-lg);font-weight:bold"><span data-text="d"></span>d <span data-text="h"></span>h <span data-text="m"></span>m <span data-text="s"></span>s</span>
<span style="font-size:var(--text-sm);margin-left:var(--sp-2)">until 2027</span>
</div>
{:/nomarkdown}
</div>
</div>


</div>
</div>
