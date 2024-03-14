'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('video', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should be able to display a video element', function () {
    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).find('.inline-video').should('have.length', 1);
    cy.get('video.inline-video')
      .then(function ($el) {
        var videoElement = $el.get(0);
        return videoElement.play().then(function () {
          return videoElement.duration;
        });
      })
      .should('be.greaterThan', 0);
  });
});
