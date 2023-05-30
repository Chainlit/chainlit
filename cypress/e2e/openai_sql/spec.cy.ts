import { submitMessage } from "../../support/testUtils";

describe("OpenAI SQL", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should output an SQL query", () => {
    cy.get("#welcome-screen").should("exist");
    submitMessage("How many minutes of video were watched");
    const messages = cy.get(".message");
    messages.should("have.length", 2);

    messages.eq(1).should("contain", "SELECT");
  });
});
