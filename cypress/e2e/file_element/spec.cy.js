'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('file', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should be able to display a file element', function () {
    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).find('.inline-file').should('have.length', 4);
    cy.get('.inline-file').should(function ($files) {
      var downloads = $files
        .map(function (i, el) {
          return Cypress.$(el).attr('download');
        })
        .get();
      expect(downloads).to.have.members([
        'example.mp4',
        'cat.jpeg',
        'hello.py',
        'example.mp3'
      ]);
    });
  });
});
