import { runTestServer } from "../../support/testUtils";

describe("Author rename", () => {
  before(() => {
    runTestServer();
  });

  it("should be able to rename authors", () => {
    cy.get(".message").eq(0).should("contain", "Albert Einstein");
    cy.get(".message").eq(1).should("contain", "Assistant");
  });
});
