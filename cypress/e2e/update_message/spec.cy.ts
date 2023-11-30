import { runTestServer } from '../../support/testUtils';

describe('Update Message', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to update a message', () => {
    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).should('contain', 'Hello');
    cy.get('.step').eq(0).should('contain', 'Hello again!');
  });
});
