/* eslint node: true */
/**
 * Convert a jsonapi response to mirage fixtures
 *
 * curl 'http://localhost:8000/api/v1/foo-bars' | node jsonapi-to-mirage-fixture.js
 */
var fs = require('fs')

getStdin(stdin => {
  var json = JSON.parse(stdin)
  var data = json.data.concat(json.included || [])

  var map = data.reduce((map, obj) => {
    if (!map.has(obj.type)) {
      map.set(obj.type, [])
    }

    return map
  }, new Map)

  data.forEach(obj =>
    map.get(obj.type).push(new JSONAPIObject(obj))
  )

  for (var m of map) {
    var type        = m[0]
    var fixtureData = m[1]

    fs.writeFileSync(`${type}.js`,
      `export default ${JSON.stringify(fixtureData, null, 2)}`
    )
  }
})

function JSONAPIObject(jsonapi) {
  jsonApiToMirageFixture(this, jsonapi)
}

function jsonApiToMirageFixture(target, jsonapi) {
  target.id = jsonapi.id

  if (jsonapi.relationships) {
    Object.keys(jsonapi.relationships).sort().forEach(k => {
      target[`${camelize(k)}Id`] = jsonapi.relationships[k].data.id
    })
  }

  if (jsonapi.attributes) {
    Object.keys(jsonapi.attributes).sort().forEach(k => {
      target[camelize(k)] = jsonapi.attributes[k]
    })
  }
}

function camelize(str) {
  return str.replace(/-(a-z])/g, g => g[1].toUpperCase())
}

function getStdin(cb) {
  var stdin = ''
  process.stdin.setEncoding('utf8')

  process.stdin.on('readable', () => {
    var chunk = process.stdin.read()
    if (chunk !== null) {
      stdin += chunk
    }
  })

  process.stdin.on('end', () => cb(stdin))
}
