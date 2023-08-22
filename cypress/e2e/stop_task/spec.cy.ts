import {
  describeSyncAsync,
  runTestServer,
  submitMessage,
} from "../../support/testUtils";

describeSyncAsync("Stop task", (mode) => {
  before(() => {
    runTestServer(mode);
  });

  it("should be able to stop a task", () => {
    cy.get(".message").should("have.length", 1);

    cy.get(".message").last().should("contain.text", "Message 1");
    cy.get("#stop-button").should("exist").click();
    cy.get("#stop-button").should("not.exist");

    cy.get(".message").should("have.length", 2);

    cy.get(".message")
      .last()
      .should("contain.text", "Task stopped by the user.");

    cy.wait(5000);

    cy.get(".message").should("have.length", 2);

    submitMessage("Hello");

    cy.get(".message").should("have.length", 4);

    cy.get(".message").last().should("contain.text", "World");
  });
});
