import { runTestServer } from "../../support/testUtils";

describe("Auth Custom client", () => {
  before(() => {
    runTestServer();
  });

  it("should call the custom client", () => {
    cy.get("#session-error").should("exist");
  });
});
