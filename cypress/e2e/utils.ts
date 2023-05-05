export function submitMessage(message: string) {
  cy.wait(2000);
  cy.get(`#chat-input`).should("not.be.disabled").type(`${message}{enter}`);
}
