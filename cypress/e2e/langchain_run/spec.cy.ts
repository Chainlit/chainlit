import { submitMessage } from "../../support/testUtils";

describe("LangChain run", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should use the run function defined by the developer", () => {
    cy.get("#welcome-screen").should("exist");
    submitMessage("Hello");
    cy.get("#llmchain-done").should("exist");
    const messages = cy.get(".message");
    messages.should("have.length", 2);
    messages.eq(1).should("contain", "4");
  });
});
