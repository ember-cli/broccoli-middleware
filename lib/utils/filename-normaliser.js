'use strict';

const path = require('path');
const findup = require('find-up');
const { existsSync } = require('fs');

const pkg = require(findup.sync('package.json'));

function normaliseFileName(fileName = '') {
  // check for invalid file paths
  // for example,
  // path.basename('myfile') will be myfile, doesn't need normalisation as this is probably
  // not a template file
  // path.basename('templates/myfile') will not be equal to fileName
  if (path.basename(fileName) === fileName) {
    return null;
  }

  // handles module unification layout
  // location as per stack  : src/ui/components/my-component/template.hbs
  // should be normalised to: src/ui/components/my-component/template.hbs
  if (fileName.startsWith('src')) {
    return fileName;
  }

  // handle templates inside application with either pod or classic structure
  // Classic Structure
  // location as per stack  : project-name/templates/templateName.hbs
  // should be normalised to: app/templates/templateName.hbs
  // Pods
  // location as per stack  : project-name/routeName/templateName.hbs
  // should be normalised to: app/routeName/templateName.hbs
  if (fileName.startsWith(pkg.name)) {
    let fileNameElements = fileName.split(path.sep);
    fileNameElements.shift();

    return path.join('app', ...fileNameElements);
  }

  // handle templates inside in-repo engines
  // location as per stack  : engine-name/templates/cars.hbs
  // should be normalised to: lib/engine-name/addon/templates/templateName.hbs
  let fileNameElements = fileName.split(path.sep);
  fileNameElements = ['lib', fileNameElements.shift(), 'addon', ...fileNameElements];

  return path.join(...fileNameElements);
}

function getNormalisedFileName(fileName, line = 1, column = 1) {
  let normalisedFileName = normaliseFileName(fileName);
  if (existsSync(normalisedFileName)) {
    return `${normalisedFileName}:${line}:${column}`;
  }

  return null;
}

module.exports = { normaliseFileName, getNormalisedFileName };
