<div class="no-toc">

# Drops

<!-- ## Examples, recipes, patterns -->

### How much code it would take<br> with other frameworks?

</div>

<div class="drops" data-scope="{ tag: 'all' }">

<div class="drops-filter">
<button data-class="{active: tag === 'all'}" data-onclick="tag = 'all'">all</button>
<button data-class="{active: tag === 'interaction'}" data-onclick="tag = 'interaction'">interaction</button>
<button data-class="{active: tag === 'form'}" data-onclick="tag = 'form'">form</button>
<button data-class="{active: tag === 'data'}" data-onclick="tag = 'data'">data</button>
<button data-class="{active: tag === 'layout'}" data-onclick="tag = 'layout'">layout</button>
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
<div class="drop-demo demo bg-graph-paper" data-scope="{ count: 0 }">
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
<div class="drop-demo demo bg-graph-paper" data-scope="{ c: 0, f: 32, setC(v) { this.c = v; this.f = this.c * 9/5 + 32 }, setF(v) { this.f = v; this.c = (this.f - 32) * 5/9 } }">
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
<div class="drop-demo demo bg-graph-paper" data-scope="{ max: 15, elapsed: 0, setMax(v) { this.max = v } }" data-fx="() => { let id = setInterval(() => elapsed < max && elapsed++, 1000); return () => clearInterval(id) }">
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
<div class="drop-demo demo bg-graph-paper" data-scope="{ items: ['Hans','Claus','Karl'], sel: 0, name: '', filter: '', setFilter(v) { this.filter = v }, pick(v) { this.sel = v; this.name = this.items[v] }, setName(v) { this.name = v }, match(n) { return n.toLowerCase().includes(filter.toLowerCase()) }, add() { this.items.push(this.name); this.name = '' }, upd() { this.items[this.sel] = this.name }, del() { this.items.splice(this.sel, 1); this.sel = Math.min(this.sel, this.items.length - 1) } }">
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
<div class="drop-demo demo bg-graph-paper" data-scope="{ tab: 'one' }">
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
<div class="drop-demo demo bg-graph-paper" data-scope="{ open: false }">
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
<div class="drop-demo demo bg-graph-paper" data-scope="{ items: [{title:'What is sprae?', body:'A 5kb reactive library for HTML.'}, {title:'Build step needed?', body:'No. One script tag is enough.'}, {title:'Production-ready?', body:'Yes. 3+ years, 13 major versions.'}] }">
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
<div class="drop-demo demo bg-graph-paper" data-scope="{ open: false }">
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
<div class="drop-demo demo bg-graph-paper" data-scope="{ sel: ['Apple','Cherry'], all: ['Apple','Banana','Cherry'], has(f) { return sel.includes(f) }, flip(f, on) { on ? sel.push(f) : sel.splice(sel.indexOf(f), 1) } }">
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
<div class="drop-demo demo bg-graph-paper" data-scope="{ cols: 3 }" data-resize="e => cols = Math.max(1, Math.floor(e.width / 120))">
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
<div class="drop-demo demo bg-graph-paper" data-scope="{ dark: false }">
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
<div class="drop-demo demo bg-graph-paper" data-scope="{ colors: [{name:'Blue',h:262},{name:'Teal',h:180},{name:'Rose',h:0},{name:'Amber',h:80}], pick(h) { document.documentElement.style.setProperty('--accent-h', h) } }">
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
<div class="drop-demo demo bg-graph-paper" data-scope="{ rows: [{name:'Alice',age:32},{name:'Bob',age:25},{name:'Carol',age:41}], col: 'name', asc: true, sort(c) { if (this.col===c) this.asc=!this.asc; else { this.col=c; this.asc=true }; let a=this.asc, k=this.col; this.rows.sort(function(x,y) { let r = String(x[k]).localeCompare(String(y[k]), undefined, {numeric:true}); return a ? r : -r }) } }" markdown="0">
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


</div>
</div>
