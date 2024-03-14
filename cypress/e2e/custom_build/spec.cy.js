'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('Custom Build', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should correctly serve the custom build page', function () {
    cy.get('body').contains(
      'This is a test page for custom build configuration.'
    );
  });
});
