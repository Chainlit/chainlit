export function submitMessage(message: string) {
  cy.get(`#chat-input`).type(`${message}{enter}`);
}
