'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('DisablePromptPlayground', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should not display the playground button', function () {
    cy.wait(2000);
    cy.get('.playground-button').should('not.exist');
  });
});
