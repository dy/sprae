import { dir } from "../core.js";

// ref must be last within primaries, since that must be skipped by :each, but before secondaries
dir('ref', (el, state) => v => typeof v === 'string' ? state[v] = el : v.call(null, el))
