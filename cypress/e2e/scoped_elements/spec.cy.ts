describe("Scoped Elements", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should be able to display inlined, side and page elements", () => {
    cy.get(".message").should("have.length", 3);

    cy.get(".message").eq(0).find(".inline-image").should("have.length", 0);
    cy.get(".message").eq(0).find(".element-link").should("have.length", 0);
    cy.get(".message").eq(0).find(".inline-pdf").should("have.length", 0);

    cy.get(".message").eq(1).find(".inline-image").should("have.length", 1);
    cy.get(".message").eq(1).find(".element-link").should("have.length", 2);
    cy.get(".message").eq(1).find(".inline-pdf").should("have.length", 1);

    cy.get(".message").eq(2).find(".inline-image").should("have.length", 1);
    cy.get(".message").eq(2).find(".element-link").should("have.length", 2);
    cy.get(".message").eq(2).find(".inline-pdf").should("have.length", 1);
  });
});
