import { submitMessage } from "./utils";

describe("OpenAI SQL", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.intercept("/message").as("message");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should work locally", () => {
    cy.get("#welcome-screen").should("exist");
    submitMessage(
      "How many minutes of video were watched"
    );
    cy.get("#chat-loading").should("exist");
    cy.wait(["@message"]);
    cy.get("#chat-loading").should("not.exist");
    const messages = cy.get(".message");
    messages.should("have.length", 2);

    messages.eq(1).should("contain", "SELECT");
  });
});
