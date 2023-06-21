import { submitMessage } from "../../support/testUtils";

describe("Llama Index factory", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should be able to create a llama_index instance and run it", () => {
    cy.get("#welcome-screen").should("exist");
    submitMessage("T-shirt");

    cy.get("#llm-done").should("exist");
    cy.get("#llm-done").click();

    cy.get(".message").should("have.length", 5);

    cy.get(".message").eq(1).should("contain", "retrieve");
    cy.get(".message").eq(2).get(".playground-button").should("exist");

    cy.get(".message").eq(3).should("not.contain", "Error");
  });
});
