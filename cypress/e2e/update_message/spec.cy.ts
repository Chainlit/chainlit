import { runTestServer } from "../../support/testUtils";

describe("Update Message", () => {
  before(() => {
    runTestServer();
  });

  it("should be able to update a message", () => {
    cy.get(".message").should("have.length", 1);
    cy.get(".message").eq(0).should("contain", "Hello");
    cy.get(".message").eq(0).should("contain", "Hello again!");
  });
});
