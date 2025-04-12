// :class="..."

export default (el, cur) => (
  cur = new Set,
  v => {
    let clsx = new Set;
    if (v) {
      if (typeof v === "string") v.split(' ').map(cls => clsx.add(cls));
      else if (Array.isArray(v)) v.map(v => v && clsx.add(v));
      else Object.entries(v).map(([k, v]) => v && clsx.add(k));
    }
    for (let cls of cur) if (clsx.has(cls)) clsx.delete(cls); else el.classList.remove(cls);
    for (let cls of cur = clsx) el.classList.add(cls)
  }
)
