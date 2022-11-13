import v from 'value-ref'
import { signal } from '@preact/signals'
import test, {is, throws} from 'tst'
import {tick, time} from 'wait-please'
import sporae from '../sporae.js'
import h from 'hyperf'


test('conditions: short', async () => {
  let el = h`<p>
    <span :if="a==1">a</span>
    <span :else-if="a==2">b</span>
    <span :else >c</span>
  </p>`

  const params = sporae(el, { a: 1 })

  is(el.innerHTML, '<span>a</span>')
  params.a = 2
  is(el.innerHTML, '<span>b</span>')
  params.a = 3
  is(el.innerHTML, '<span>c</span>')

  delete params.a
})

test('conditions: short with insertions', async () => {
  let el = h`<p>
    <span :if="a==1" :text="['1:',a]"></span>
    <span :else-if="a==2" :text="['2:',a]"></span>
    <span :else :text="a"></span>
  </p>`

  const params = templize(el, { a: 1 }, exprProcessor)

  is(el.innerHTML, '<span>1:1</span>')
  params.a = 2
  is(el.innerHTML, '<span>2:2</span>')
  params.a = 3
  is(el.innerHTML, '<span>3</span>')
  params.a = 4
  is(el.innerHTML, '<span>4</span>')

  params.a = 1
  is(el.innerHTML, '<span>1:1</span>')
  params.a = 4
  is(el.innerHTML, '<span>4</span>')

  delete params.a
})

test.todo('conditions: reactive values', async () => {

})


test('loops: short', async () => {
  // FIXME: in some conspicuous reason jsdom fails to update text nodes somehow
  let el = h`<p>
    <span :each="item in items" :text="item"></span>
  </p>`

  const params = sporae(el, { items: [] })

  is(el.innerHTML, '')
  params.items = [1,2]
  is(el.innerHTML, '<span>1</span><span>2</span>')
  params.items = []
  is(el.innerHTML, '')

  delete params.items
})

test.todo('loops: reactive values', async () => {
})

test.todo('loops: condition within loop')

test.todo('loops: loop within condition')
