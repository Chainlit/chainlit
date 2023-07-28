describe("Initial headers", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000", {
      headers: { "test-header": "test header value" },
    });
    cy.wait(["@settings"]);
  });

  it("should be able to access initial headers", () => {
    cy.get(".message").should("have.length", 2);

    cy.get(".message").eq(0).should("contain", "8000");
    cy.get(".message").eq(1).should("contain", "test header value");
  });
});
