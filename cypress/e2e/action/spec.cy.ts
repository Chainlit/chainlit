import { runTestServer } from "../../support/testUtils";

describe("Action", () => {
  before(() => {
    runTestServer()
  });

  it("should correctly execute and display actions", () => {    
    cy.get(".message").should("have.length", 1);
    cy.get(".message:first-of-type button").should("have.length", 5);
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
    cy.get(".message:first-of-type button")
      .eq(3)
      .should('have.class', 'action-multiple-actions')
      .should("contain", "multiple action one");
    cy.get(".message:first-of-type button")
      .eq(4)
      .should('have.class', 'action-multiple-actions')
      .should("contain", "multiple action two");


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

    // Click on "multiple action one", should remove the correct action button
    cy.contains("button", "multiple action one")
      .invoke("attr", "data-action-id")
      .then((actionId: string) => {
        cy.contains("button", "multiple action one").click()
        cy.get(".message").should("have.length", 4);
        cy.get(".message").eq(3).should("contain", `Action(id=${actionId}) has been removed!`);
        cy.contains("button", "multiple action one").should("not.exist");
      })

    // Click on "multiple action two", should remove the correct action button
    cy.contains("button", "multiple action two")
      .invoke("attr", "data-action-id")
      .then((actionId: string) => {
        cy.contains("button", "multiple action two").click()
        cy.get(".message").should("have.length", 5);
        cy.get(".message").eq(4).should("contain", `Action(id=${actionId}) has been removed!`);
        cy.contains("button", "multiple action two").should("not.exist");
      })
  });
});
