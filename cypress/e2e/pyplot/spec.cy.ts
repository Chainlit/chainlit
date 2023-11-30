import { runTestServer } from '../../support/testUtils';

describe('pyplot', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to display an inline chart', () => {
    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).find('.inline-image').should('have.length', 1);
  });
});
