import { runTestServer, submitMessage } from "../../support/testUtils";

describe("Local db", () => {
  before(() => {
    runTestServer();
  });

  it("should be able to see and interact with a stored conversation", () => {
    submitMessage("Hi");

    cy.get(".message").should("have.length", 4);

    cy.get(".inline-image").should("have.length", 3);
    cy.get(".element-link").should("have.length", 7);

    cy.get(".message").eq(1).find(".element-link").should("have.length", 2);
    cy.get(".message").eq(2).find(".element-link").should("have.length", 2);
    cy.get(".message").eq(3).find(".element-link").should("have.length", 3);

    cy.get(".message").eq(1).find(".positive-feedback-off").click();

    cy.get(".message")
      .eq(1)
      .find(".positive-feedback-on")
      .should("have.length", 1);

    cy.visit("dataset");
    cy.get(".conversation-row").should("have.length", 1);

    cy.get(".open-conversation-button").click();

    cy.get(".message").should("have.length", 4);

    cy.get(".message").eq(1).find(".element-link").should("have.length", 2);
    cy.get(".message").eq(2).find(".element-link").should("have.length", 2);
    cy.get(".message").eq(3).find(".element-link").should("have.length", 3);

    cy.get(".inline-image").should("have.length", 3);
    cy.get(".element-link").should("have.length", 7);

    cy.get(".message")
      .eq(1)
      .find(".positive-feedback-on")
      .should("have.length", 1);
  });
});
