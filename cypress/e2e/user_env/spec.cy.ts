import { submitMessage } from "../../support/testUtils";

describe("User Env", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should be able to ask a user for required keys", () => {
    const key = "TEST_KEY";
    const keyValue = "TEST_VALUE";

    cy.get("#env").should("exist");
    cy.get(`.${key}`).should("exist").type(keyValue);

    cy.get("#submit-env").should("exist").click();
    cy.get("#welcome-screen").should("exist");

    submitMessage("Hello");

    cy.get(".message").should("have.length", 2);
    cy.get(".message").eq(1).should("contain", keyValue);
  });
});
