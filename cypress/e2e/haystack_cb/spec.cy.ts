import { runTestServer } from "../../support/testUtils";

describe("Haystack Callback", () => {
  before(() => {
    runTestServer();
  });

  it("should be able to send messages to the UI with prompts and elements", () => {
    cy.get("#welcome-screen").should("exist");

    cy.get(".message").should("have.length", 1);

    cy.get("#agent-done").should("exist").click();

    cy.get(".message").should("have.length", 4);

    cy.get("#tool-done").should("exist").click();

    cy.get(".message").should("have.length", 5);
  });
});
