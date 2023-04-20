import { submitMessage } from "./utils";
const path = require('path');

describe("LangChain Document QA", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.intercept("/message").as("message");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should work locally", () => {
    cy.get("input[type=file]").selectFile(path.join(__dirname, "state_of_the_union.txt"), {force: true});
    cy.get("#-loading").should("exist");
    cy.get("#-loading").should("not.exist");

    submitMessage(
      "What is the U.S. Department of Justice doing to combat the crimes of Russian oligarchs?"
    );
    cy.wait(["@message"]);
    const messages = cy.get(".message");
    messages.should("have.length", 4);

    messages.eq(3).should("contain", "Sources: 3-pl");

    cy.get(".document-link").eq(0).should("contain", "3-pl");
    cy.get(".document-link").eq(0).click();

    const sideView = cy.get("#side-view-content");
    sideView.should("exist");
  });
});
