describe("Action", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should correctly execute and display actions", () => {
    cy.get(".message")
      .eq(0)
      .get("#action-label-action")
      .should("exist")
      .should("contain", "Test Label");

    cy.get(".message")
      .should("have.length", 1)
      .eq(0)
      .get("#action-test-action")
      .should("exist")
      .click();

    cy.get(".message").should("have.length", 2);
    cy.get(".message").eq(1).should("contain", "Executed test action!");

    cy.get(".message")
      .eq(0)
      .get("#action-removable-action")
      .should("exist")
      .click();

    cy.get(".message").should("have.length", 3);
    cy.get(".message").eq(2).should("contain", "Executed removable action!");

    cy.get(".message")
      .eq(0)
      .get("#action-removable-action")
      .should("not.exist");
  });
});
