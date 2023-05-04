describe("Elements", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should work locally", () => {
    cy.get(".message").should("have.length", 1);

    cy.get(".inlined-image").should("have.length", 1);

    cy.get(".element-link").eq(0).should("contain", "text1");
    cy.get(".element-link").eq(0).click();

    const sideView = cy.get("#side-view-content");
    sideView.should("exist");
  });
});
