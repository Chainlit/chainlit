export function submitMessage(message: string) {
  cy.wait(1000);
  cy.get(`#chat-input`).should("not.be.disabled").type(`${message}{enter}`);
}
