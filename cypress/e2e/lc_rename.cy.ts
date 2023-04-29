import { submitMessage } from "./utils";

describe("LangChain rename", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.intercept("/message").as("message");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should work locally", () => {
    cy.get("#welcome-screen").should("exist");
    submitMessage(
      "What is 2+2?"
    );
    cy.wait(["@message"]);
    cy.get("#albert-einstein-done").should("exist")
    cy.get("#albert-einstein-done").click()
    cy.get("#llmchain-done").click()
    const messages = cy.get(".message");
    messages.should("have.length", 5);

    cy.get("#playground").should("not.exist")
    messages.eq(2).trigger("mouseover")
    cy.get("#playground-button").should("exist")
    cy.get("#playground-button").click()
    cy.get("#playground").should("exist")
  });
});
