var ajv = require('ajv')
var xtend = require('xtend')
var defaults = require('./defaults')

module.exports = function createContext (opts) {
  var context = ajv(xtend(defaults, opts))

  // support format comparison on basic strings (no format defined)
  context.addFormat('lexicographical', {
    validate: function () { return true },
    // TODO: add something like typewise sorting?
    compare: function (a, b) { return a > b ? 1 : (a < b ? -1 : 0) },
  })

  // ltgt macros
  function ltgtKeyword(op) {
    var minimum = op[0] === 'g' // gt | gte
    var exclusive = op[2] !== 'e' // gte | lte

    context.addKeyword(op, {
      macro: function (value) {
        var suffix = (minimum ? 'in' : 'ax') + 'imum'

        var valKey, excKey
        if (typeof value === 'number') {
          valKey = 'm' + suffix
          excKey = 'exclusiveM' + suffix
        }
        // TODO: else if (typeof value === '...')?
        else {
          valKey = 'formatM' + suffix
          excKey = 'formatExclusiveM' + suffix
        }

        var schema = {}
        schema[valKey] = value
        schema[excKey] = exclusive

        if (!schema.format) schema.format = 'lexicographical'
          return schema
      }
    })
  }

  ltgtKeyword('gte')
  ltgtKeyword('gt')
  ltgtKeyword('lt')
  ltgtKeyword('lte')

  // eq, ne macros
  context.addKeyword('eq', {
    macro: function (schema) {
      return { constant: schema }
    }
  })
  context.addKeyword('ne', {
    macro: function (schema) {
      return { not: { eq: schema } }
    }
  })

  // size macro
  context.addKeyword('size', {
    macro: function (schema) {
      return {
        minLength: schema,
        maxLength: schema,
        minItems: schema,
        maxItems: schema,
        minProperties: schema,
        maxProperties: schema
      }
    }
  })


  try {
    var semver = require('semver')

    context.addFormat('semver', {
      validate: function (v) {
        return semver.valid(v, true)
      },
      compare: function (a, b) {
        return semver.compare(a, b, true)
      }
    })

    context.addFormat('semver-range', {
      validate: function (r) {
        return !!semver.validRange(r)
      },
      compare: function (a, b) {
        function cmp(v, r) {
          return semver.gtr(v, r) ? 1 : (semver.ltr(v, r) ? -1 : 0)
        }

        // one value must be a discrete version (for now)
        if (semver.valid(a, true)) return cmp(a, b)
          if (semver.valid(b, true)) return cmp(b, a)

            throw new Error('Cannot compare two ranges')
      }
    })

    context.addFormat('semver+strict', {
      validate: semver.valid,
      compare: semver.compare
    })
  }
  catch (err) {}

  return context
}
