export function submitMessage(message: string) {
  cy.get(`#chat-input > input`).type(`${message}{enter}`);
}
