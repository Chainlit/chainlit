import { runTestServer, submitMessage } from "../../support/testUtils";

describe("Default Expand", () => {
  before(() => {
    runTestServer()
  });

  it("should be able to set the default_expand_messages field in the config to have the CoT expanded by default", () => {
    cy.get("#welcome-screen").should("exist");
    submitMessage("Hello");

    cy.get(".message").should("have.length", 5);
  });
});
