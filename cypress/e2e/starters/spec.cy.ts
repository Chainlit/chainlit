describe('Starters', () => {
  it('should be able to use a starter', () => {
    cy.get('#starter-test1').should('be.visible').click();
    cy.get('.step').should('have.length', 2);

    cy.get('.step').eq(0).contains('Running starter 1');
    cy.get('.step').eq(1).contains('Running starter 1');
  });
});
