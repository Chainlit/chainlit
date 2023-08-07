import { runTestServer } from "../../support/testUtils";

describe("Emitter should be reachable from all contexts", () => {
  before(() => {
    runTestServer()
  });

  it("should find the Emitter from async, make_async and async_from_sync contexts", () => {
    cy.get(".message").should("have.length", 3);

    cy.get(".message").eq(0).should("contain", "emitter from async found!");

    cy.get(".message")
      .eq(1)
      .should("contain", "emitter from make_async found!");

    cy.get(".message")
      .eq(2)
      .should("contain", "emitter from async_from_sync found!");
  });
});
