import { submitMessage } from "../../support/testUtils";

describe("Default Expand", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should be able to set the default_expand_messages field in the config to have the CoT expanded by default", () => {
    cy.get("#welcome-screen").should("exist");
    submitMessage("Hello");

    cy.get(".message").should("have.length", 5);
  });
});
