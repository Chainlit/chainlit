describe('Llama Index Callback', () => {
  it('should be able to send messages to the UI with prompts and elements', () => {
    cy.get('.step').should('have.length', 3);

    cy.get('#step-retrieve').should('exist').click();

    // Same idea as elements/spec.cy.ts: scope to `.step`, then `.element-link` (not every
    // `.message-content` in the step wraps sources — the first block can be empty).
    cy.get('#step-retrieve')
      .closest('.step')
      .find('.element-link')
      .eq(0)
      .should('contain', 'Source 0');
  });
});
