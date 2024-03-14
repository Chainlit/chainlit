'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('Context should be reachable', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should find the Emitter from async, make_async and async_from_sync contexts', function () {
    cy.get('.step').should('have.length', 3);
    cy.get('.step').eq(0).should('contain', 'emitter from async found!');
    cy.get('.step').eq(1).should('contain', 'emitter from make_async found!');
    cy.get('.step')
      .eq(2)
      .should('contain', 'emitter from async_from_sync found!');
  });
});
