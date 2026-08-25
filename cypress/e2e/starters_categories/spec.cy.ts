describe('Starters with Categories', () => {
  it('should display category buttons', () => {
    cy.get('#starters').should('exist');

    cy.contains('button', 'Creative').should('exist');
    cy.contains('button', 'Educational').should('exist');
  });

  it('should show starters when category is clicked', () => {
    cy.contains('button', 'Creative').should('be.visible').click();
    cy.get('#starter-poem').should('exist');
    cy.get('#starter-story').should('exist');
  });

  it('should be able to use a starter from a category', () => {
    cy.contains('button', 'Creative').should('be.visible').click();
    cy.get('#starter-poem').should('exist').click();
    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(0).contains('Write a poem');
  });

  it('should toggle category selection', () => {
    cy.contains('button', 'Creative').should('be.visible').click();
    cy.get('#starter-poem').should('exist');

    cy.contains('button', 'Creative').click();
    cy.get('#starter-poem').should('not.exist');
  });
});
