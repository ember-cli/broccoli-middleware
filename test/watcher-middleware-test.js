'use strict';

var expect = require('chai').expect;
var RSVP = require('rsvp');
var watcherMiddleware = require('./../lib/index').watcherMiddleware;
var fixture = require('./helpers/fixture-path');
var TestHTTPServer = require('./helpers/test-http-server');

describe('watcher-middleware', function() {
  describe('watcher resolves correctly', function() {
    var server;

    afterEach(function() {
      server.stop();
      server = null;
    })

    it('sets the request & response headers correctly', function(done) {
      var watcher = RSVP.Promise.resolve({
        'directory': fixture('basic-file')
      });

      var middleware = watcherMiddleware(watcher, {
        autoIndex: false
      });

      var wrapperMiddleware = function(req, resp /*next*/) {
        middleware(req, resp, function() {
          // assert request headers
          var broccoliHeader = req.headers['x-broccoli'];
          expect(broccoliHeader).to.have.property('url');
          expect(broccoliHeader).to.have.property('filename');
          expect(broccoliHeader).to.have.property('outputPath');

          // assert response headers
          expect(resp.getHeader('Cache-Control')).to.be.equal('private, max-age=0, must-revalidate');
          done();
        })
      };

      server = new TestHTTPServer(wrapperMiddleware);

      server.start()
        .then(function(info) {
          return server.request('/index.html', {
            info: info
          });
        });
    });
  });

  describe('watcher is rejected', function() {
    var watcher;
    var server;

    beforeEach(function() {
      watcher = RSVP.Promise.reject({
        stack: 'Build error',
        broccoliPayload: 'Broccoli files messed up'
      });

      watcher['builder'] = {};
    });

    afterEach(function() {
      server.stop();
      server = null;
    })

    it('returns HTTP 500 when there is build error', function() {
      var middleware = watcherMiddleware(watcher, {
        autoIndex: false
      });

      server = new TestHTTPServer(middleware);

      return server.start()
        .then(function(info) {
          return server.request('/index.html', {
            info: info
          });
        })
        .catch(function(error) {
          expect(error).to.match(/StatusCodeError: 500/);
        });
    });
  });
});
