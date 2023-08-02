describe("Action", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should correctly execute and display actions", () => {    
    cy.get(".message").should("have.length", 1);
    cy.get(".message:first-of-type button").should("have.length", 3);
    cy.get(".message:first-of-type button")
      .eq(0)
      .should('have.class', 'action-test-action')
      .should("contain", "test action");
    cy.get(".message:first-of-type button")
      .eq(1)
      .should('have.class', 'action-removable-action')
      .should("contain", "removable action");
    cy.get(".message:first-of-type button")
      .eq(2)
      .should('have.class', 'action-label-action')
      .should("contain", "Test Label");


    // Click on "test action"
    cy.get(".message:first-of-type .action-test-action")
      .click();

    cy.get(".message").should("have.length", 2);
    cy.get(".message").eq(1).should("contain", "Executed test action!");
    cy.get(".message:first-of-type .action-test-action")
      .should("exist");

    // Click on "removable action"
    cy.get(".message:first-of-type .action-removable-action")
      .click();

    cy.get(".message").should("have.length", 3);
    cy.get(".message").eq(2).should("contain", "Executed removable action!");

    cy.get(".message:first-of-type .action-removable-action")
      .should("not.exist");
  });
});
