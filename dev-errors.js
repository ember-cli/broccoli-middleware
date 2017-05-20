var express = require('express');
var getMiddleware = require('./lib/middleware');
var app = express();
var RSVP = require('rsvp');

// configure error
var error = new Error("message");
error.pos = 10
error.loc = 5
// error._babel = // cant remember what goes here
error.codeFrame =  'some code frame';
error.file = 'foo/bar.js';
error.treeDir =  'asdf/adsf/asdf/'

var watcher = RSVP.Promise.reject(error);
watcher.builder = {
  builder: {
    outputPath: 'sdfg'
  }
};

app.use(getMiddleware(watcher, {}));
app.listen(3000, function () {
  console.log('Example app listening on port http://localhost:3000/ ');
});
