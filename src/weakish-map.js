// based on https://github.com/WebReflection/not-so-weak/
const refs = new WeakMap;

const set = value => {
  const ref = new WeakRef(value);
  refs.set(value, ref);
  return ref;
};

const get = value => refs.get(value) || set(value);

export class WeakishMap extends Map {
  #registry = new FinalizationRegistry(key => super.delete(key));
  get size() { return [...this].length }
  constructor(entries = []) {
    super();
    for (const [key, value] of entries) this.set(key, value);
  }
  get(key) {
    return super.get(key)?.deref();
  }
  set(key, value) {
    let ref = super.get(key);
    if (ref) this.#registry.unregister(ref);
    ref = get(value);
    this.#registry.register(value, key, ref);
    return super.set(key, ref);
  }
}