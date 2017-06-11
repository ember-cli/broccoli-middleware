'use strict';

var fs = require('fs');
var path = require('path');

var handlebars = require('handlebars');
var errorTemplate = handlebars.compile(fs.readFileSync(path.resolve(__dirname, '..', 'templates/error.html')).toString());

module.exports = function errorHandler(response, options) {
  // All errors thrown from builder.build() are guaranteed to be
  // Builder.BuildError instances.
  var buildError = options.buildError;
  var broccoliPayload = buildError.broccoliPayload;
  var broccoliNode = broccoliPayload.broccoliNode || {};
  var versions = broccoliPayload.versions || {};

  var versionString = Object.keys(versions).sort().map(function(key) {
    return versions[key] ? key + '@' + versions[key] : '';
  }).join(', ');

  var context = {
    stack: broccoliPayload.error.stack,
    broccoliBuilderErrorStack: buildError.stack,
    instantiationStack: broccoliPayload.instantiationStack,
    errorMessage: buildError.message,
    liveReloadPath: options.liveReloadPath,
    codeFrame: broccoliPayload.error.codeFrame,
    nodeName: broccoliNode.nodeName,
    nodeAnnotation: broccoliNode.nodeAnnotation,
    errorType: broccoliPayload.error.errorType,
    location: broccoliPayload.error.location,
    versionString: versionString
  };
  response.setHeader('Content-Type', 'text/html');
  response.writeHead(500);
  response.end(errorTemplate(context));
}
