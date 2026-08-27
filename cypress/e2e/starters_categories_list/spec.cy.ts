describe('Starters with Categories (list layout)', () => {
  it('should render every category as a card simultaneously', () => {
    cy.get('#starters').should('exist');

    cy.get('[data-category="creative"]').should('be.visible');
    cy.get('[data-category="educational"]').should('be.visible');

    cy.get('[data-category="creative"]').within(() => {
      cy.contains('poem').should('be.visible');
      cy.contains('story').should('be.visible');
    });
    cy.get('[data-category="educational"]').within(() => {
      cy.contains('explain').should('be.visible');
    });
  });

  it('should send a starter message when a row is clicked', () => {
    cy.get('[data-category="creative"]').within(() => {
      cy.contains('poem').click();
    });
    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(0).contains('Write a poem');
  });
});
