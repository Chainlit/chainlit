import { submitMessage } from "./utils";

describe("LangChain MRKL", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.intercept("/message").as("message");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should work locally", () => {
    cy.get("#welcome-screen").should("exist");
    submitMessage(
      "Who is Leo DiCaprio's girlfriend? What is her current age raised to the 0.43 power?"
    );
    cy.get("#chat-loading").should("exist");
    cy.wait(["@message"]);
    cy.get("#chat-loading").should("not.exist");
    let messages = cy.get(".message");
    messages.should("have.length", 2);
    cy.get("#steps-toggle").click();
    cy.wait(1000);
    messages = cy.get(".message");
    messages.should("have.length", 8);
  });
});
