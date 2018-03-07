'use strict';

const expect = require('chai').expect;
const RSVP = require('rsvp');
const serveAssetMiddleware = require('./../lib/index').serveAssetMiddleware;
const watcherMiddleware = require('./../lib/index').watcherMiddleware;
const fixture = require('./helpers/fixture-path');
const TestHTTPServer = require('./helpers/test-http-server');

describe('serve-middleware', function() {
  describe('watcher resolves correctly', function() {
    let server;

    afterEach(function() {
      server.stop();
      server = null;
    });

    it('serves the given file if found', function() {
      const watcher = RSVP.Promise.resolve({
        directory: fixture('basic-file')
      });

      const middleware = watcherMiddleware(watcher, {
        autoIndex: false
      });

      server = new TestHTTPServer(middleware);
      server.addMiddleware(serveAssetMiddleware);

      return server
        .start()
        .then(info => {
          return server.request('/index.html', {
            info: info
          });
        })
        .then(content => {
          expect(content).to.match(/This is broccoli middleware page/);
        });
    });

    it('serves the given file without an extension', function() {
      const watcher = RSVP.Promise.resolve({
        directory: fixture('basic-file')
      });

      const middleware = watcherMiddleware(watcher, {
        autoIndex: false
      });

      server = new TestHTTPServer(middleware);
      server.addMiddleware(serveAssetMiddleware);

      return server
        .start()
        .then(info => {
          return server.request('/noext', {
            info: info,
            resolveWithFullResponse: true
          });
        })
        .then(res => {
          expect(res.headers['content-type']).to.equal(
            'application/octet-stream'
          );
          expect(res.headers['content-length']).to.equal(
            'content'.length.toString()
          );
          expect(res.body).to.equal('content');
        });
    });

    it('serves the content-type according to the header', function() {
      const watcher = RSVP.Promise.resolve({
        directory: fixture('wasm-file')
      });

      const middleware = watcherMiddleware(watcher, {
        autoIndex: false
      });

      server = new TestHTTPServer(middleware);
      server.addMiddleware(serveAssetMiddleware);

      return server
        .start()
        .then(info => {
          return server.request('/lib/foo.wasm', {
            info: info,
            resolveWithFullResponse: true
          });
        })
        .then(response => {
          expect(response.statusCode).to.equal(200);
          expect(response.headers['content-type']).to.equal('application/wasm');
        });
    });

    it('no response headers are set & it calls the next middleware when file is not found', function(done) {
      const watcher = RSVP.Promise.resolve({
        directory: fixture('basic-file')
      });

      const middleware = watcherMiddleware(watcher, {
        autoIndex: false
      });

      const wrapperMiddleware = (req, resp /*, next*/) => {
        serveAssetMiddleware(req, resp, () => {
          // assert response headers
          expect(resp.getHeader('Cache-Control')).to.be.equal(
            'private, max-age=0, must-revalidate'
          );
          expect(resp.getHeader('Last-Modified')).to.not.be.ok;
          expect(resp.getHeader('Content-Type')).to.not.be.ok;
          done();
        });
      };

      server = new TestHTTPServer(middleware);
      server.addMiddleware(wrapperMiddleware);

      server.start().then(info => {
        return server.request('/non-existent-file', {
          info: info
        });
      });
    });

    it('bypasses middleware if request is a directory and autoIndex is set to false', function(done) {
      const watcher = RSVP.Promise.resolve({
        directory: fixture('no-index')
      });

      const middleware = watcherMiddleware(watcher, {
        autoIndex: false
      });

      const wrapperMiddleware = (req, resp /*next*/) => {
        serveAssetMiddleware(req, resp, () => {
          const broccoliHeader = req.headers['x-broccoli'];
          expect(broccoliHeader.filename).to.equal('');
          done();
        });
      };

      server = new TestHTTPServer(middleware);
      server.addMiddleware(wrapperMiddleware);

      server.start().then(info => {
        return server.request('', {
          info
        });
      });
    });

    it('responds with directory structure template if request is a directory and autoIndex is set to true', function() {
      const watcher = RSVP.Promise.resolve({
        directory: fixture('no-index')
      });

      const middleware = watcherMiddleware(watcher, {
        autoIndex: true
      });

      server = new TestHTTPServer(middleware);
      server.addMiddleware(serveAssetMiddleware);

      return server
        .start()
        .then(info => {
          return server.request('', {
            info
          });
        })
        .then(content => {
          expect(content).to.match(/Generated by Broccoli/);
        });
    });

    it('responds with index.html if request is a directory and autoIndex is set to true', function() {
      const watcher = RSVP.Promise.resolve({
        directory: fixture('basic-file')
      });
      const middleware = watcherMiddleware(watcher, {
        autoIndex: true
      });

      server = new TestHTTPServer(middleware);
      server.addMiddleware(serveAssetMiddleware);

      return server
        .start()
        .then(info => {
          return server.request('/index.html', {
            info
          });
        })
        .then(content => {
          expect(content).to.match(/This is broccoli middleware page/);
        });
    });

    it('bypasses serving assets if x-broccoli request header is not present', function() {
      const fakeMiddleware = (req, resp) => {
        resp.write('Hello World!');
        resp.end();
      };

      server = new TestHTTPServer(serveAssetMiddleware);
      server.addMiddleware(fakeMiddleware);

      return server
        .start()
        .then(info => {
          return server.request('/index.html', {
            info
          });
        })
        .then(content => {
          expect(content).to.be.equal('Hello World!');
        });
    });

    it('bypasses serving assets if filename is invalid', function() {
      const fakeMiddleware = (req, resp, next) => {
        req.headers['x-broccoli'] = {
          foo: 'bar'
        };

        resp.setHeader('apple', 'orange');
        next();
      };

      const wrapperMiddleware = (req, resp /*, next*/) => {
        serveAssetMiddleware(req, resp, () => {
          resp.write('Hello World!');
          resp.end();
        });
      };

      server = new TestHTTPServer(fakeMiddleware);
      server.addMiddleware(wrapperMiddleware);

      return server
        .start()
        .then(info => {
          return server.request('/index.html', {
            info
          });
        })
        .then(content => {
          expect(content).to.be.equal('Hello World!');
        });
    });
  });
});
