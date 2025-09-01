describe('Custom Element Command', () => {
  it('should be able to send a command from a custom element', () => {
    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).find('.inline-custom').should('have.length', 1);

    cy.get('#send').click();

    cy.get('.step').should('have.length', 3);
    cy.get('.step').eq(1).should('contain', 'Hello from custom element');
    cy.get('.step').eq(2).should('contain', 'Received command: my_command');
  });
});
