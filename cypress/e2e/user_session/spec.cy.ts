import { submitMessage } from "../../support/testUtils";

function newSession() {
  cy.get("#new-chat-button").should("exist").click();
  cy.get("#new-chat-dialog").should("exist");
  cy.get("#confirm").should("exist").click();

  cy.get("#new-chat-dialog").should("not.exist");

  cy.get("#welcome-screen").should("exist");
}

describe("User Session", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should be able to store data related per user session", () => {
    cy.get("#welcome-screen").should("exist");

    submitMessage("Hello 1");

    cy.get(".message").should("have.length", 2);
    cy.get(".message").eq(1).should("contain", "Prev message: None");

    submitMessage("Hello 2");

    cy.get(".message").should("have.length", 4);
    cy.get(".message").eq(3).should("contain", "Prev message: Hello 1");

    newSession();

    submitMessage("Hello 3");

    cy.get(".message").should("have.length", 2);
    cy.get(".message").eq(1).should("contain", "Prev message: None");

    submitMessage("Hello 4");

    cy.get(".message").should("have.length", 4);
    cy.get(".message").eq(3).should("contain", "Prev message: Hello 3");
  });
});
