import { submitMessage } from "../../support/testUtils";

describe("LangChain postprocess", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should be able to postprocess a LangChain output", () => {
    cy.get("#welcome-screen").should("exist");
    submitMessage("Hello");
    cy.get("#llmchain-done").should("exist");
    const messages = cy.get(".message");
    messages.should("have.length", 2);
    messages.eq(1).should("contain", "In the end it doesn't even matter.");
  });
});
