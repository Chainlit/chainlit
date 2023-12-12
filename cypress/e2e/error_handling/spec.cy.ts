import { runTestServer } from '../../support/testUtils';

describe('Error Handling', () => {
  before(() => {
    runTestServer();
  });

  it('should correctly display errors', () => {
    cy.get('.step')
      .should('have.length', 1)
      .eq(0)
      .should('contain', 'This is an error message');
  });
});
