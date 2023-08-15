import { runTestServer } from "../../support/testUtils";

describe("Db Custom client", () => {
  before(() => {
    runTestServer()
  });

  it("should call the custom client", () => {
    cy.get(".message")
      .should("have.length", 1)
      .eq(0)
      .should("contain", "NotImplementedError");
  });
});
