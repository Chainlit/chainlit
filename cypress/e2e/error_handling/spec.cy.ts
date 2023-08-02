describe("Error Handling", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should correctly display errors", () => {
    cy.get(".message")
      .should("have.length", 1)
      .eq(0)
      .should("contain", "This is an error message");
  });
});
