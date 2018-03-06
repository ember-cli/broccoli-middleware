'use strict';

const express = require('express');
const request = require('request-promise');
const RSVP = require('rsvp');
const http = require('http');

let serverID = 0;

/**
 * Express server to mock requests and responses.
 */
function TestHTTPServer(middleware, options) {
  this.options = options || {};
  this.middleware = middleware;
  this.listener = null;
  this.id = ++serverID;
  this.app = express();
  const r1 = express.Router();
  r1.get('/*', middleware);
  this.app.use(r1);
}

/**
 * Adds a middleware to the the end of the chain.
 *
 * @public
 *
 */
TestHTTPServer.prototype.addMiddleware = function(middleware) {
  const router = express.Router();
  router.get('/*', middleware);
  this.app.use(router);
};

/**
 * Starts the express server on the given host and port. Host defaults to localhost and
 * port defaults to 4200 if not provided.
 *
 * @public
 */
TestHTTPServer.prototype.start = function() {
  const options = this.options;
  const app = this.app;

  const context = this;
  return new RSVP.Promise((resolve /*reject*/) => {
    const port = options.port || 4200;
    const host = options.host || 'localhost';

    const listener = app.listen(port, host, () => {
      const host = listener.address().address;
      const port = listener.address().port;

      context.listener = listener;
      const info = {
        host: host,
        port: port
      };

      resolve(info);
    });
  });
};

/**
 * Allows to make a request to the given path.
 *
 * @public
 */
TestHTTPServer.prototype.request = function(urlPath, options) {
  const info = options.info;
  const reqOptions = {
    method: 'GET',
    uri: `http://[${info.host}]:${info.port}${urlPath}`,
    resolveWithFullResponse: options.resolveWithFullResponse === true
  };
  return request(reqOptions);
};

/**
 * Kills the express server.
 *
 * @public
 */
TestHTTPServer.prototype.stop = function() {
  if (this.listener) {
    this.listener.close();
    this.listener = null;
    http.globalAgent.destroy();
  }
};

module.exports = TestHTTPServer;
