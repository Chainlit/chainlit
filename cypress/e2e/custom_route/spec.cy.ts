import { runTestServer } from "../../support/testUtils";

describe("Custom Route", () => {
  before(() => {
    runTestServer();
    cy.visit("hello");
  });

  it("should correctly serve the custom route", () => {
    cy.get("body").contains("Hello World");
  });
});
