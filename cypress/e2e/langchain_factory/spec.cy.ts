import { submitMessage } from "../../support/testUtils";

describe("LangChain factory", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should be able to instantiate a LangChain chain and run it", () => {
    cy.get("#welcome-screen").should("exist");
    submitMessage("T-shirt");

    cy.get("#llmchain-done").should("exist");
    cy.get("#llmchain-done").click();

    cy.get(".message").should("have.length", 3);

    cy.get(".message").eq(1).should("contain", "LLMChain");
    cy.get(".message").eq(1).get(".playground-button").should("exist");

    cy.get(".message").eq(2).should("not.contain", "Error");
    cy.get(".message").eq(2).should("contain", "Chatbot");
  });
});
