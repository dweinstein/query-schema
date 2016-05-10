var ajv = require('ajv')
var createContext = require('./create-context')

try {
  var SetAssociativeCache = require('sacjs')
  defaults.cache = new SetAssociativeCache({
    assoc: 4,
    size: 10000,
    algorithm: 'lru'
  })
}
catch (err) {
}

module.exports = createContext()
