import { runTestServer } from '../../support/testUtils';

describe('Context should be reachable', () => {
  before(() => {
    runTestServer();
  });

  it('should find the Emitter from async, make_async and async_from_sync contexts', () => {
    cy.get('.step').should('have.length', 3);

    cy.get('.step').eq(0).should('contain', 'emitter from async found!');

    cy.get('.step').eq(1).should('contain', 'emitter from make_async found!');

    cy.get('.step')
      .eq(2)
      .should('contain', 'emitter from async_from_sync found!');
  });
});
