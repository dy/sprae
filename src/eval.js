let evaluatorMemo = {}
let AsyncFunction = Object.getPrototypeOf(async function(){}).constructor

// borrowed from alpine: https://github.com/alpinejs/alpine/blob/main/packages/alpinejs/src/evaluator.js#L61
// it seems to be more robust than subscript
export function parseExpr(expression, el) {
    if (evaluatorMemo[expression]) return evaluatorMemo[expression]

    // Some expressions that are useful in Alpine are not valid as the right side of an expression.
    // Here we'll detect if the expression isn't valid for an assignement and wrap it in a self-
    // calling function so that we don't throw an error AND a "return" statement can b e used.
    let rightSideSafeExpression = 0
      // Support expressions starting with "if" statements like: "if (...) doSomething()"
      || /^[\n\s]*if.*\(.*\)/.test(expression)
      // Support expressions starting with "let/const" like: "let foo = 'bar'"
      || /^(let|const)\s/.test(expression)
          ? `(() => { ${expression} })()`
          : expression

    const safeFunction = () => {
      try {
        return new Function(['scope'], `let result; with (scope) { result = ${rightSideSafeExpression} }; return result;`)
      } catch ( error ) {
        Object.assign( error, { el, expression } )
        console.warn(`∴ Expression Error: ${error.message}\n\n${ expression ? 'Expression: \"' + expression + '\"\n\n' : '' }`, el)
        setTimeout(() => { throw error }, 0)
        return Promise.resolve()
      }
    }

    return evaluatorMemo[expression] = safeFunction()
}