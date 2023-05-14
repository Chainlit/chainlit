const path = require("path");

describe("Upload file", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should be able to receive and decode the file", () => {
    cy.fixture("state_of_the_union.txt", "utf-8").as("file");
    cy.get("input[type=file]").selectFile("@file", { force: true });

    const messages = cy.get(".message");
    messages.should("have.length", 2);

    messages
      .eq(1)
      .should("contain", "state_of_the_union.txt uploaded, it contains");
  });
});
