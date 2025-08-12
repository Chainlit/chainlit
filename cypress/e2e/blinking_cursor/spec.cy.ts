import { submitMessage } from '../../support/testUtils';

describe('Blinking cursor', () => {
  it('It should display until a step or message is sent', () => {
    cy.get('.step').should('have.length', 1);
    cy.contains('.step', 'Hello, this is a test message!').should('be.visible');

    submitMessage('tool');

    cy.get('.step').should('have.length', 3);
    cy.get('.step').last().should('have.attr', 'data-step-type', 'tool');
    cy.get('.step').last().next('.animate-pulse').should('not.exist');

    submitMessage('Jeeves');
    cy.get('.step')
      .last()
      .next('.animate-pulse', { timeout: 500 })
      .should('exist');
    cy.get('.step')
      .last()
      .next('.animate-pulse', { timeout: 5500 })
      .should('not.exist');
    cy.get('.step').should('have.length', 5);
    cy.get('.step').last().should('contain.text', 'Received message: Jeeves');
  });
});
