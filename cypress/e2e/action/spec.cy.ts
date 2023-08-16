import { runTestServer } from "../../support/testUtils";

describe("Action", () => {
  before(() => {
    runTestServer();
  });

  it("should correctly execute and display actions", () => {
    // Click on "test action"
    cy.get("[id='test-action']").should("be.visible");
    cy.get("[id='test-action']").click();
    cy.get(".message").should("have.length", 2);
    cy.get(".message").eq(1).should("contain", "Executed test action!");
    cy.get("[id='test-action']").should("exist");

    // Click on "removable action"
    cy.get("[id='removable-action']").should("be.visible");
    cy.get("[id='removable-action']").click();
    cy.get(".message").should("have.length", 3);
    cy.get(".message").eq(2).should("contain", "Executed removable action!");
    cy.get("[id='removable-action']").should("not.exist");

    // Click on "multiple action one", should remove the correct action button
    cy.get("[id='actions-button']").should("be.visible");
    cy.get("[id='actions-button']").click();
    cy.get(".message").should("have.length", 3);

    cy.get("[id='multiple-action-one']").should("be.visible");
    cy.get("[id='multiple-action-one']").click();
    cy.get(".message")
      .eq(3)
      .should("contain", "Action(id=multiple-action-one) has been removed!");
    cy.get("[id='multiple-action-one']").should("not.exist");

    // Click on "multiple action two", should remove the correct action button
    cy.get(".message").should("have.length", 4);
    cy.get("[id='multiple-action-two']").should("be.visible");
    cy.get("[id='multiple-action-two']").click();
    cy.get(".message")
      .eq(4)
      .should("contain", "Action(id=multiple-action-two) has been removed!");
    cy.get("[id='multiple-action-two']").should("not.exist");
    cy.get("[id='actions-button']").should("not.exist");
  });
});
