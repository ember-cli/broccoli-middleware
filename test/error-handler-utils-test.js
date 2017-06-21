'use strict';

const expect = require('chai').expect;
const toVersionString = require('./../lib/utils/error-handler-utils').toVersionString;

describe('error handler utils', function() {
  it('parses version object into a version string', function() {
    const versions = {
      'broccoli-builder': '0.18.5',
      node: 'v6.9.1'
    };
    const versionString = toVersionString(versions);

    expect(versionString).to.equal('broccoli-builder@0.18.5, node@v6.9.1');
  });

  it('versions are alphabetically sorted by name', function() {
    const versions = {
      node: 'v6.9.1',
      'broccoli-builder': '0.18.5',
      ember: '2.13.2'
    };
    const versionString = toVersionString(versions);

    expect(versionString).to.equal('broccoli-builder@0.18.5, ember@2.13.2, node@v6.9.1');
  });

  it('gracefully handles null values', function() {
    const versions = {
      'broccoli-builder': '0.18.5',
      node: 'v6.9.1',
      ember: null
    };
    const versionString = toVersionString(versions);

    expect(versionString).to.equal('broccoli-builder@0.18.5, node@v6.9.1');
  });
});
