import {
  closeHistory,
  openHistory,
  runTestServer,
  submitMessage
} from '../../support/testUtils';

describe('Input History', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to show the last message in the message history', () => {
    openHistory();

    cy.get('.history-item').should('have.length', 0);
    cy.get('#history-empty').should('exist');

    closeHistory();

    const timestamp = Date.now().toString();

    submitMessage(timestamp);

    openHistory();

    cy.get('#history-empty').should('not.exist');
    cy.get('.history-item').should('have.length', 1);
    cy.get('.history-item').eq(0).should('contain', timestamp).click();
    cy.get('.history-item').should('have.length', 0);

    cy.get('#chat-input').should('have.value', timestamp);
  });
});
