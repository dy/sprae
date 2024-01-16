import { compile, parse } from 'subscript/justin.js'

export default (src) => {
  let tree = parse(src)

  // convert values access to signals subscription
  const t = (node) => {
    // a -> a?.valueOf(), a.b.c -> a.b.c?.valueOf(), a.b[c] -> a.b[c]?.valueOf()
    if (!Array.isArray(node) || node[0] === '.' || (node[0] === '[' && node.length > 2)) return ['(', ['?.', node, 'valueOf'], '']

    // "a", 1.0 etc - plain primitives
    if (node[0] === '') return node

    // {a:b}
    if (node[0] === ':') return [node[0], node[1], t(node[2])]

    // a.b = c
    if (node[0] === '=') return [node[0], node[1], t(node[2])]

    return node.map((child, i) => {
      if (!i) return child
      return t(child)
    })
  }

  tree = t(tree)

  const fn = compile(tree)

  return fn
}
