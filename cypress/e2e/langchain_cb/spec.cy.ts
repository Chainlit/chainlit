import { describeSyncAsync, runTestServer } from "../../support/testUtils";

describeSyncAsync("Langchain Callback", (mode) => {
  before(() => {
    runTestServer(mode);
  });

  it("should be able to send messages to the UI with prompts", () => {
    cy.get("#welcome-screen").should("exist");

    cy.get(".message").should("have.length", 1);

    cy.get("#testchain1-done").should("exist").click();

    cy.get(".message").should("have.length", 3);

    cy.get("#testtool1-done").should("exist").click();

    cy.get(".message").should("have.length", 4);

    cy.get(".playground-button").eq(0).should("exist").click();

    cy.get(".formatted-editor [contenteditable]")
      .should("exist")
      .should("contain", "This is prompt of llm1");

    cy.get(".completion-editor [contenteditable]")
      .should("exist")
      .should("contain", "This is the response of llm1");

    cy.get("#close-playground").should("exist").click();
  });
});
