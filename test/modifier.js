import { tick, time } from "wait-please";
import sprae from '../../sprae.js'
import h from "hyperf";
import test, { any, is, ok } from "tst";
import { store } from '../../store.js'
import { use, signal, batch, untracked } from '../../core.js'

// import * as signals from '@preact/signals-core'
// use(signals)

const _dispose = Symbol.dispose;
