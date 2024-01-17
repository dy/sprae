import { compile, parse, binary, operator } from 'subscript/justin.js'

// to enable array methods we have to enable functions
binary('=>', 2)
operator('=>', (a, b) => {
  a = a == '' ? [] : // () =>
    a[0] === ',' ? (a = a.slice(1)) : // (a,c) =>
      (a = [a]), // a =>
    b = compile(b)

  return ctx => (
    ctx = Object.create(ctx),
    (...args) => (a.map((a, i) => ctx[a] = args[i]), b(ctx))
  )
})

export default (src) => {
  let tree = parse(src)

  // convert values access to signals subscription
  const t = (node) => {
    // a -> a?.valueOf(), a.b.c -> a.b.c?.valueOf(), a.b[c] -> a.b[c]?.valueOf()
    if (!Array.isArray(node) || node[0] === '.' || (node[0] === '[' && node.length > 2)) return ['(', ['?.', node, 'valueOf'], '']

    // "a", 1.0 etc - skip plain primitives
    if (node[0] === '') return node

    // {a:b} ->  {a:b?.valueOf()}
    if (node[0] === ':') return [node[0], node[1], t(node[2])]

    // a.b = c -> a.b?.valueOf()
    if (node[0] === '=') return [node[0], node[1], t(node[2])]

    // a -> a?.valueOf()
    return node.map((child, i) => {
      if (!i) return child
      return t(child)
    })
  }

  tree = t(tree)

  return compile(tree)
}
