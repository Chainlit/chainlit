describe("remove_elements", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should be able to remove elements", () => {
    cy.get("#welcome-screen").should("exist");

    cy.get(".message").should("have.length", 1);
    cy.get(".inline-image").should("have.length", 1);
  });
});
