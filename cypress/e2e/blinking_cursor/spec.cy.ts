import { submitMessage } from '../../support/testUtils';

describe('Blinking cursor', () => {
  it('It should display until a message is sent', () => {
    cy.get('.step').should('have.length', 1);
    cy.contains('.step', 'Hello, this is a test message!').should('be.visible');

    submitMessage('Jeeves');

    cy.get('.step').should('have.length', 2);
    cy.get('.step').last().should('contain.text', 'Jeeves');
    cy.get('.step').last().next('.animate-pulse').should('exist');

    cy.wait(5500);

    cy.get('.step').last().next('.animate-pulse').should('not.exist');
    cy.get('.step').should('have.length', 3);
    cy.get('.step').last().should('contain.text', 'Received message: Jeeves');
  });
});
