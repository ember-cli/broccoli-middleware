var test = require('tap').test
var broccoli = require('..')
var Builder = broccoli.Builder
var RSVP = require('rsvp')
var heimdall = require('heimdalljs')

RSVP.on('error', function(error) {
  throw error
})

function countingTree (readFn, description) {
  return {
    read: function (readTree) {
      this.readCount++
      return readFn.call(this, readTree)
    },
    readCount: 0,
    description: description,
    cleanup: function () {
      var self = this

      return RSVP.resolve()
        .then(function() {
          self.cleanupCount++
        })
    },
    cleanupCount: 0
  }
}


test('Builder', function (t) {
  test('core functionality', function (t) {
    t.end()

    test('build', function (t) {
      test('passes through string tree', function (t) {
        var builder = new Builder('someDir')
        builder.build().then(function (hash) {
          t.equal(hash.directory, 'someDir')
          t.end()
        })
      })

      test('calls read on the given tree object', function (t) {
        var builder = new Builder({
          read: function (readTree) { return 'someDir' }
        })
        builder.build().then(function (hash) {
          t.equal(hash.directory, 'someDir')
          t.end()
        })
      })

      t.end()
    })

    test('readTree deduplicates', function (t) {
      var subtree = new countingTree(function (readTree) { return 'foo' })
      var builder = new Builder({
        read: function (readTree) {
          return readTree(subtree).then(function (hash) {
            var dirPromise = readTree(subtree) // read subtree again
            t.ok(dirPromise.then, 'is promise, not string')
            return dirPromise
          })
        }
      })
      builder.build().then(function (hash) {
        t.equal(hash.directory, 'foo')
        t.equal(subtree.readCount, 1)
        t.end()
      })
    })

    test('cleanup', function (t) {
      test('is called on all trees called ever', function (t) {
        var tree = countingTree(function (readTree) {
          // Interesting edge case: Read subtree1 on the first read, subtree2 on
          // the second
          return readTree(this.readCount === 1 ? subtree1 : subtree2)
        })
        var subtree1 = countingTree(function (readTree) { return 'foo' })
        var subtree2 = countingTree(function (readTree) { throw new Error('bar') })
        var builder = new Builder(tree)
        builder.build().then(function (hash) {
          t.equal(hash.directory, 'foo')
          builder.build().catch(function (err) {
            t.equal(err.message, 'The Broccoli Plugin: [object Object] failed with:')
            return builder.cleanup()
          })
          .then(function() {
            t.equal(tree.cleanupCount, 1)
            t.equal(subtree1.cleanupCount, 1)
            t.equal(subtree2.cleanupCount, 1)
            t.end()
          })
        })
      })

      t.end()
    })
  })

  test('tree graph', function (t) {
    var parent = countingTree(function (readTree) {
      return readTree(child).then(function (dir) {
        return new RSVP.Promise(function (resolve, reject) {
          setTimeout(function() { resolve('parentTreeDir') }, 30)
        })
      })
    }, 'parent')

    var child = countingTree(function (readTree) {
      return readTree('srcDir').then(function (dir) {
        return new RSVP.Promise(function (resolve, reject) {
          setTimeout(function() { resolve('childTreeDir') }, 20)
        })
      })
    }, 'child')

    var timeEqual = function (a, b) {
      t.equal(typeof a, 'number')

      // do not run timing assertions in Travis builds
      // the actual results of process.hrtime() are not
      // reliable
      if (process.env.CI !== 'true') {
        t.ok(a >= b - 5e7 && a <= b + 5e7, a + ' should be within ' + b + ' +/- 5e7')
      }
    }

    var builder = new Builder(parent)
    builder.build().then(function (hash) {
      t.equal(hash.directory, 'parentTreeDir')
      var parentBroccoliNode = hash.graph
      t.equal(parentBroccoliNode.directory, 'parentTreeDir')
      t.equal(parentBroccoliNode.tree, parent)
      // timeEqual(parentBroccoliNode.totalTime, 50e6)
      t.equal(parentBroccoliNode.subtrees.length, 1)
      var childBroccoliNode = parentBroccoliNode.subtrees[0]
      t.equal(childBroccoliNode.directory, 'childTreeDir')
      t.equal(childBroccoliNode.tree, child)
      // timeEqual(childBroccoliNode.totalTime, 20e6)
      t.equal(childBroccoliNode.subtrees.length, 1)
      var leafBroccoliNode = childBroccoliNode.subtrees[0]
      t.equal(leafBroccoliNode.directory, 'srcDir')
      t.equal(leafBroccoliNode.tree, 'srcDir')
      // t.equal(leafBroccoliNode.totalTime, 0)
      t.equal(leafBroccoliNode.subtrees.length, 0)


      var json = heimdall.toJSON()

      t.equal(json.nodes.length, 4)

      var parentNode = json.nodes[1]
      timeEqual(parentNode.stats.time.self, 30e6)

      var childNode = json.nodes[2]
      timeEqual(childNode.stats.time.self, 20e6)

      var leafNode = json.nodes[3]
      timeEqual(leafNode.stats.time.self, 0)

      for (var i=0; i<json.nodes.length; ++i) {
        delete json.nodes[i].stats.time.self
      }

      t.deepEqual(json, {
        nodes: [{
          _id: 0,
          id: {
            name: 'heimdall',
          },
          stats: {
            own: {},
            time: {},
          },
          children: [1],
        }, {
          _id: 1,
          id: {
            name: 'parent',
          },
          stats: {
            own: {},
            time: {},
          },
          children: [2],
        }, {
          _id: 2,
          id: {
            name: 'child',
          },
          stats: {
            own: {},
            time: {},
          },
          children: [3],
        }, {
          _id: 3,
          id: {
            name: 'srcDir',
          },
          stats: {
            own: {},
            time: {},
          },
          children: [],
        }],
      })
      t.end()
    })
  })

  test('string tree callback', function (t) {
    var builder = new Builder('fooDir')
    builder.build(function willReadStringTree (dir) {
      t.equal(dir, 'fooDir')
      t.end()
    })
  })

  t.end()
})
