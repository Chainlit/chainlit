describe('Chat Prefill', () => {
  it('should display a prefill message when the chat starts', () => {
    cy.visit('/?prompt=Hello%20World');

    cy.get('#chat-input', { timeout: 10000 })
      .should('be.visible')
      .and('have.value', 'Hello World');
  });

  it('should not prefill the chat when prompt is empty', () => {
    cy.visit('/');

    cy.get('#chat-input', { timeout: 10000 })
      .should('be.visible')
      .and('have.value', '');
  });

  it('should correctly prefill with special characters', () => {
    const prompt = encodeURIComponent("Hi there! How's it going?");
    cy.visit(`/?prompt=${prompt}`);

    cy.get('#chat-input', { timeout: 10000 })
      .should('be.visible')
      .and('have.value', "Hi there! How's it going?");
  });

  it('should focus the chat input when prefilled', () => {
    cy.visit('/?prompt=FocusTest');

    cy.get('#chat-input', { timeout: 10000 })
      .should('be.visible')
      .and('have.focus');
  });
});
