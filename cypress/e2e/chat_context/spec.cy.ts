import { runTestServer, submitMessage } from '../../support/testUtils';

describe('Chat Context', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to current conversation chat history', () => {
    submitMessage('Hello 1');

    cy.get('.step').eq(1).should('contain', 'Chat context length: 1');

    submitMessage('Hello 2');

    cy.get('.step').eq(3).should('contain', 'Chat context length: 3');
  });
});
