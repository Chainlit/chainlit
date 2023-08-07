import { describeSyncAsync, runTestServer, submitMessage } from "../../support/testUtils";

describeSyncAsync("OpenAI", (mode) => {
  before(() => {
    runTestServer(mode)
  });

  it("should output an SQL query", () => {
    cy.get("#welcome-screen").should("exist");
    submitMessage("How many minutes of video were watched");
    const messages = cy.get(".message");
    messages.should("have.length", 2);
    
    messages.eq(1).should("not.be.empty");
  });
});
