import { runTestServer } from "../../support/testUtils";

describe("Initial headers", () => {
  before(() => {
    runTestServer()
    cy.visit("/", {
      headers: { "test-header": "test header value" },
    });
  });

  it("should be able to access initial headers", () => {
    cy.get(".message").should("have.length", 2);

    cy.get(".message").eq(0).should("contain", "8000");
    cy.get(".message").eq(1).should("contain", "test header value");
  });
});
