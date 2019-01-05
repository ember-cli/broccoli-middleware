'use strict';

const url = require('url');
const path = require('path');
const launchEditor = require('launch-editor');

const errorHandler = require('./utils/error-handler');
const { getNormalisedFileName } = require('./utils/filename-normaliser');

module.exports = function watcherMiddleware(watcher, options) {
  options = options || {};

  if (!options.hasOwnProperty('autoIndex')) {
    // set autoIndex to be true if not provided
    options.autoIndex = true;
  }

  return (request, response, next) => {
    watcher.then((hash) => {
      const outputPath = path.normalize(hash.directory);

      // set the x-broccoli header containing per request info used by the broccoli-middleware
      const urlToBeServed = request.url;
      const urlObj = url.parse(urlToBeServed);
      const filename = path.join(outputPath, decodeURIComponent(urlObj.pathname));
      const broccoliInfo = {
        url: urlToBeServed,
        outputPath: outputPath,
        filename: filename,
        autoIndex: options.autoIndex
      };
      request.headers['x-broccoli'] = broccoliInfo;

      // set the default response headers that are independent of the asset
      response.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');

      next();
    }, (buildError) => {
      if (request.url === '/ember_open_editor_for_template_compilation_error') {
        let errorLocation = buildError.broccoliPayload.error.location || {};
        let {
          file: fileName,
          line,
          column
        } = errorLocation;

        if (fileName) {
          let normalisedFileName = getNormalisedFileName(fileName, line, column);

          // 1) If the EMBER_CLI_EDITOR is set, it's value will be used as the editor.
          // 2) If EMBER_CLI_EDITOR is not set, launchEditor will try to guess which editor is open.
          //    a) If it succeeds, that guessed editor will be opened.
          //    b) Else, it will fall back to VISUAL and EDITOR.
          // 3) If none of these work, it will display a message asking the user to set EMBER_CLI_EDITOR
          let emberCliEditor = process.env.EMBER_CLI_EDITOR;

          return launchEditor(normalisedFileName, emberCliEditor, () => {
            if (!emberCliEditor) {
              console.log(
                'To set up the editor integration, set the env variable EMBER_CLI_EDITOR ' +
                'to an editor of your choice and restart the server.'
              );
            }
          });
        }
      }

      errorHandler(response, {
        'buildError': buildError,
        'liveReloadPath': options.liveReloadPath
      });
    })
    .catch((err) => {
      console.log(err);
    })
  }
}
