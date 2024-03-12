import { runTestServer } from "../../support/testUtils";

describe("Custom Build", () => {
  before(() => {
    runTestServer();
  });

  it("should correctly serve the custom build page", () => {
    cy.get("body").contains("This is a test page for custom build configuration.");
  });
});
