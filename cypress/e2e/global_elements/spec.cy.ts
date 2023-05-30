describe("Global Elements", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should be able to display inlined, side and page elements", () => {
    cy.get(".message").should("have.length", 2);

    cy.get(".message").eq(1).find(".inline-image").should("have.length", 0);
    cy.get(".message").eq(1).find(".element-link").should("have.length", 0);

    // Inlined
    cy.get(".message").eq(0).find(".inline-image").should("have.length", 1);
    cy.get(".message").eq(0).find(".element-link").should("have.length", 2);
    cy.get(".message")
      .eq(0)
      .find(".element-link")
      .eq(0)
      .should("contain", "text1")
      .click();

    // Side
    const sideViewTitle = cy.get("#side-view-title");
    sideViewTitle.should("exist");
    sideViewTitle.should("contain", "text1");

    const sideViewContent = cy.get("#side-view-content");
    sideViewContent.should("exist");
    sideViewContent.should("contain", "Here is a side text document");

    // Page
    cy.get(".message")
      .eq(0)
      .find(".element-link")
      .eq(1)
      .should("contain", "text2")
      .click();

    const view = cy.get("#element-view");
    view.should("exist");
    view.should("contain", "text2");
    view.should("contain", "Here is a page text document");
  });
});
