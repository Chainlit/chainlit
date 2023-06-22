describe("Custom client", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should call the custom client", () => {
    cy.get(".message")
      .should("have.length", 1)
      .eq(0)
      .should("contain", "NotImplementedError");
  });
});
