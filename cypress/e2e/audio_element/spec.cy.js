'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('audio', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should be able to display an audio element', function () {
    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).find('.inline-audio').should('have.length', 1);
    cy.get('.inline-audio audio')
      .then(function ($el) {
        var audioElement = $el.get(0);
        return audioElement.play().then(function () {
          return audioElement.duration;
        });
      })
      .should('be.greaterThan', 0);
  });
});
