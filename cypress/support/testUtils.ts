export function submitMessage(message: string) {
  cy.wait(2000);
  cy.get(`#chat-input`).should("not.be.disabled");
  cy.get(`#chat-input`).type(`${message}{enter}`);
}

export function openHistory() {
  cy.wait(2000);
  cy.get(`#chat-input`).should("not.be.disabled");
  cy.get(`#chat-input`).type(`{upArrow}`);
}

export function closeHistory() {
  cy.get(`body`).click();
}
