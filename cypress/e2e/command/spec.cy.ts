import { runTestServer } from '../../support/testUtils';

describe('Command', () => {
  before(() => {
    runTestServer();
  });

  it('should correctly display commands', () => {
    cy.get(`#chat-input`).type("/sear")
    cy.get(".command-item").should('have.length', 1);
    cy.get(".command-item").eq(0).click()

    cy.get(`#chat-input`).type("Hello{enter}")

    cy.get(".step").should('have.length', 2);
    cy.get(".step").eq(0).find(".command-span").should("have.text", "Search")

    cy.get("#command-button").should("exist")

    cy.get(".step").eq(1).invoke('text').then((text) => {
      expect(text.trim()).to.equal("Command: Search")
    })

    cy.get(`#chat-input`).type("/pic")
    cy.get(".command-item").should('have.length', 1);
    cy.get(".command-item").eq(0).click()

    cy.get(`#chat-input`).type("Hello{enter}")

    cy.get(".step").should('have.length', 4);
    cy.get(".step").eq(2).find(".command-span").should("have.text", "Picture")

    cy.get("#command-button").should("not.exist")
  });
});
