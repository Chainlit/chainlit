import { runTestServer } from '../../support/testUtils';

describe('Llama Index Callback', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to send messages to the UI with prompts and elements', () => {
    cy.get('.step').should('have.length', 3);

    const toolCall = cy.get('#step-retrieve');

    toolCall.should('exist').click();

    const toolCallContent = toolCall.get('.message-content').eq(0);

    toolCallContent
      .should('exist')
      .get('.element-link')
      .eq(0)
      .should('contain', 'Source 0');
  });
});
