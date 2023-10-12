import { runTestServer } from '../../support/testUtils';

describe('remove_elements', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to remove elements', () => {
    cy.get('.message').should('have.length', 1);
    cy.get('.inline-image').should('have.length', 1);
  });
});
