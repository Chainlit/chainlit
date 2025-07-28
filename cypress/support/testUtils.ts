const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/;
Cypress.on('uncaught:exception', (err) => {
  /* returning false here prevents Cypress from failing the test */
  if (resizeObserverLoopErrRe.test(err.message)) {
    return false;
  }
});

export function submitMessage(message: string) {
  cy.get(`#chat-input`).should('not.be.disabled').type(`${message}`);
  cy.get(`#chat-submit`).should('not.be.disabled').click();
}

export function submitMessageCopilot(message: string) {
  cy.get(`#chat-input`, { includeShadowDom: true })
    .should('be.visible')
    .should('have.attr', 'contenteditable', 'plaintext-only')
    .should('not.be.disabled')
    .then(($el) => {
      cy.wrap($el).click().type(`${message}{enter}`, {
        scrollBehavior: false
      });
    });
}

export function openHistory() {
  cy.get(`#chat-input`).should('not.be.disabled').type(`{upArrow}`);
}

export function closeHistory() {
  cy.get(`body`).click();
}
