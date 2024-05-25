import { runTestServer } from '../../support/testUtils';

describe('Llama Index Callback', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to send messages to the UI with prompts and elements', () => {
    cy.get('.step').should('have.length', 1);

    cy.get('#llm-done').should('exist').click();

    cy.get('.step').should('have.length', 3);

    cy.get('.step')
      .eq(1)
      .find('.element-link')
      .eq(0)
      .should('contain', 'Source 0');
  });
});
