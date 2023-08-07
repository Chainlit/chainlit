import { runTestServer, submitMessage } from "../../support/testUtils";

describe("on_chat_start", () => {
  before(() => {
    runTestServer()
  });

  it("should correctly run on_chat_start", () => {
    const messages = cy.get(".message");
    messages.should("have.length", 1);

    messages.eq(0).should("contain.text", "Hello!");
    messages.eq(0).should("contain.html", "<div class=\"language-python\"");
  });
});
