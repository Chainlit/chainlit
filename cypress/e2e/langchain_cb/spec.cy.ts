import { describeSyncAsync, runTestServer } from "../../support/testUtils";

describeSyncAsync("Langchain Callback", (mode) => {
  before(() => {
    runTestServer(mode)
  });

  it("it should be able to send messages to the UI with prompts", () => {
    cy.get("#welcome-screen").should("exist");

    cy.get(".message").should("have.length", 1);

    cy.get("#testchain1-done").should("exist").click();

    cy.get(".message").should("have.length", 3);

    cy.get("#testtool1-done").should("exist").click();

    cy.get(".message").should("have.length", 4);

    cy.get(".playground-button").eq(0).should("exist").click();

    cy.get("#playground")
      .should("exist")
      .get("[contenteditable=true]")
      .should("exist")
      .should(
        "contain",
        "This is prompt of llm1\nThis is the response of tool1"
      );

    cy.get("#playground").get("#close-playground").should("exist").click();
  });
});
