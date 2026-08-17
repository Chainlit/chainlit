describe('on_chat_start', () => {
  it('should correctly run on_chat_start', () => {
    cy.get('.step').should('have.length', 1);

    cy.get('.step').eq(0).should('contain.text', 'Hello!');
  });
});
