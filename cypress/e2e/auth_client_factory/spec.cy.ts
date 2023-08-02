describe("Auth Custom client", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should call the custom client", () => {
    cy.get("#session-error").should("exist");
  });
});
