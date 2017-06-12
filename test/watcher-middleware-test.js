'use strict';

const expect = require('chai').expect;
const RSVP = require('rsvp');
const watcherMiddleware = require('./../lib/index').watcherMiddleware;
const fixture = require('./helpers/fixture-path');
const TestHTTPServer = require('./helpers/test-http-server');

describe('watcher-middleware', function() {
  describe('watcher resolves correctly', function() {
    let server;

    afterEach(function() {
      server.stop();
      server = null;
    })

    it('sets the request & response headers correctly', function(done) {
      const watcher = RSVP.Promise.resolve({
        'directory': fixture('basic-file')
      });

      const middleware = watcherMiddleware(watcher, {
        autoIndex: false
      });

      const wrapperMiddleware = (req, resp /*next*/) => {
        middleware(req, resp, () => {
          // assert request headers
          const broccoliHeader = req.headers['x-broccoli'];
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
        .then((info) => {
          return server.request('/index.html', {
            info
          });
        });
    });
  });

  describe('watcher is rejected', function() {
    let watcher;
    let server;

    beforeEach(() => {
      watcher = RSVP.Promise.reject({
        stack: 'Build error',
        broccoliPayload: {
          error: {
            message: 'Broccoli files messed up'
          }
        }
      });

      watcher['builder'] = {};
    });

    afterEach(() => {
      server.stop();
      server = null;
    })

    it('returns HTTP 500 when there is build error', function() {
      const middleware = watcherMiddleware(watcher, {
        autoIndex: false
      });

      server = new TestHTTPServer(middleware);

      return server.start()
        .then((info) => {
          return server.request('/index.html', {
            info: info
          });
        })
        .catch((error) => {
          expect(error).to.match(/StatusCodeError: 500/);
        });
    });
  });
});
