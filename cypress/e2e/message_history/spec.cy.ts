import { openHistory, submitMessage } from "../../support/testUtils";

describe("Message History", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.intercept("/message").as("message");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should be able to show the last message in the message history", () => {
    const timestamp = Date.now().toString();

    submitMessage(timestamp);
    cy.wait(["@message"]);

    cy.get(".history-item").should("have.length", 0);

    openHistory();

    cy.get(".history-item").should("have.length", 1);
    cy.get(".history-item").eq(0).should("contain", timestamp).click();
    cy.get(".history-item").should("have.length", 0);

    cy.get("#chat-input").should("have.value", timestamp);
  });
});
