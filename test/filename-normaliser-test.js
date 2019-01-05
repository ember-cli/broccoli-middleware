'use strict';

const expect = require('chai').expect;
const path = require('path');
const normaliseFileName = require('./../lib/utils/filename-normaliser').normaliseFileName;

describe('file name normaliser', function() {
  describe('handles module unification layout', function() {
    it('components are normalised correctly', function() {
      const fileName = path.normalize('src/ui/components/my-component/template.hbs');
      const normalisedFileName = normaliseFileName(fileName);

      expect(normalisedFileName).to.equal(fileName);
    });
  });

  describe('handles pod layout', function() {
    it('components are normalised correctly', function() {
      const fileName = path.normalize('broccoli-middleware/components/awesome-component/template.hbs');
      const expectedFileName = path.normalize('app/components/awesome-component/template.hbs');
      const normalisedFileName = normaliseFileName(fileName);

      expect(normalisedFileName).to.equal(expectedFileName);
    });

    it('templates are normalised correctly', function() {
      const fileName = path.normalize('broccoli-middleware/awesome-route/template.hbs');
      const expectedFileName = path.normalize('app/awesome-route/template.hbs');
      const normalisedFileName = normaliseFileName(fileName);

      expect(normalisedFileName).to.equal(expectedFileName);
    });

    describe('in-repo engines are normalised correctly', function() {
      it('components are normalised correctly', function() {
        const fileName = path.normalize('awesome-engine/components/awesome-component/template.hbs');
        const expectedFileName = path.normalize('lib/awesome-engine/addon/components/awesome-component/template.hbs');
        const normalisedFileName = normaliseFileName(fileName);

        expect(normalisedFileName).to.equal(expectedFileName);
      });

      it('templates are normalised correctly', function() {
        const fileName = path.normalize('awesome-engine/awesome-route/template.hbs');
        const expectedFileName = path.normalize('lib/awesome-engine/addon/awesome-route/template.hbs');
        const normalisedFileName = normaliseFileName(fileName);

        expect(normalisedFileName).to.equal(expectedFileName);
      });
    });
  });

  describe('handles classic layout', function() {
    it('components are normalised correctly', function() {
      const fileName = path.normalize('broccoli-middleware/templates/components/awesome-component.hbs');
      const expectedFileName = path.normalize('app/templates/components/awesome-component.hbs');
      const normalisedFileName = normaliseFileName(fileName);

      expect(normalisedFileName).to.equal(expectedFileName);
    });

    it('templates are normalised correctly', function() {
      const fileName = path.normalize('broccoli-middleware/templates/application.hbs');
      const expectedFileName = path.normalize('app/templates/application.hbs');
      const normalisedFileName = normaliseFileName(fileName);

      expect(normalisedFileName).to.equal(expectedFileName);
    });

    describe('in-repo engines are normalised correctly', function() {
      it('components are normalised correctly', function() {
        const fileName = path.normalize('awesome-engine/templates/components/awesome-component.hbs');
        const expectedFileName = path.normalize('lib/awesome-engine/addon/templates/components/awesome-component.hbs');
        const normalisedFileName = normaliseFileName(fileName);

        expect(normalisedFileName).to.equal(expectedFileName);
      });

      it('templates are normalised correctly', function() {
        const fileName = path.normalize('awesome-engine/templates/awesome-route.hbs');
        const expectedFileName = path.normalize('lib/awesome-engine/addon/templates/awesome-route.hbs');
        const normalisedFileName = normaliseFileName(fileName);

        expect(normalisedFileName).to.equal(expectedFileName);
      });
    });
  });
});
