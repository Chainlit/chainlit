'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('Custom Route', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
    cy.visit('hello');
  });
  it('should correctly serve the custom route', function () {
    cy.get('body').contains('Hello World');
  });
});
