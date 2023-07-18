import { submitMessage } from "../../support/testUtils";

describe("Author rename", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should be able to rename authors", () => {
    cy.get("#welcome-screen").should("exist");
    submitMessage("What is 2+2?");
    cy.get("#albert-einstein-done").should("exist");
    cy.get("#albert-einstein-done").click();
    cy.get(".message").eq(1).should("contain", "Albert Einstein");
    cy.get(".message").should("have.length", 4);

    cy.get(".message").eq(3).should("contain", "Assistant");
  });
});
