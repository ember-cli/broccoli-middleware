'use strict';

var express = require('express');
var request = require('request-promise');
var RSVP = require('rsvp');

var serverID = 0;

/**
 * Express server to mock requests and responses.
 */
function TestHTTPServer(middleware, options) {
  this.options = options || {};
  this.middleware = middleware;
  this.listener = null;
  this.id = ++serverID;
}

/**
 * Starts the express server on the given host and port. Host defaults to localhost and
 * port defaults to 4200 if not provided.
 *
 * @public
 */
TestHTTPServer.prototype.start = function() {
  var options = this.options;
  var app = express();
  var middleware = this.middleware;

  var r1 = express.Router();
  r1.get('/*', middleware);
  app.use(r1);

  var context = this;
  return new RSVP.Promise(function(resolve /*reject*/) {
    var port = options.port || 4200;
    var host = options.host || 'localhost';

    var listener = app.listen(port, host, function() {
      var host = listener.address().address;
      var port = listener.address().port;

      context.listener = listener;
      var info = {
        host: host,
        port: port
      };

      resolve(info);
    });
  });
}

/**
 * Allows to make a request to the given path.
 *
 * @public
 */
TestHTTPServer.prototype.request = function(urlPath, options) {
  var info = options.info;
  var url = 'http://[' + info.host + ']:' + info.port;
  return request(url + urlPath, options);
}

/**
 * Kills the express server.
 *
 * @public
 */
TestHTTPServer.prototype.stop = function() {
  if (this.listener) {
    this.listener.close();
  }
}

module.exports = TestHTTPServer;
