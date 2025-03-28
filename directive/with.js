import sprae, { dir } from "../core.js";
import store, { _signals } from '../store.js';

dir('with', (el, rootState, state) => (state=null, values => sprae(el, state ? values : state = store(values, rootState))))
