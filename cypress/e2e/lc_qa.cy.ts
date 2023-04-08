describe("LangChain QA", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should have a welcome screen", () => {
    cy.get("#welcome-screen").should("exist");
  });
});
