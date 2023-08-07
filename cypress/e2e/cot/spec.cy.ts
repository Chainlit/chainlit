import { runTestServer, submitMessage } from "../../support/testUtils";

function testPlayground(index, shouldContain: string) {
  cy.get(".playground-button").eq(index).should("exist").click();

  cy.get("#playground")
    .should("exist")
    .get("[contenteditable=true]")
    .should("exist")
    .should("contain", shouldContain);

  cy.get("#playground").get("#close-playground").should("exist").click();
}

describe("Chain of Thought", () => {
  before(() => {
    runTestServer()
  });

  it("should be able to display a nested CoT", () => {
    cy.get("#welcome-screen").should("exist");
    submitMessage("Hello");

    cy.get("#tool-1-loading").should("exist");
    cy.get("#tool-1-loading").click();

    cy.get("#tool-2-loading").should("exist");
    cy.get("#tool-2-loading").click();

    cy.get("#tool-1-done").should("exist");
    cy.get("#tool-2-done").should("exist");

    testPlayground(0, "Tool 1 prompt");
    cy.wait(1000);
    testPlayground(1, "Tool 2 prompt");

    cy.get(".message").should("have.length", 5);
  });
});
