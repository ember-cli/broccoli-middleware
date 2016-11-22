'use strict';

var paths = [
  'lib',
  'test'
];
require('mocha-eslint')(paths, {
  timeout: 5000
});
