import { runTestServer } from "../../support/testUtils";

describe("audio", () => {
  before(() => {
    runTestServer();
  });

  it("should be able to display an audio element", () => {
    cy.get("#welcome-screen").should("exist");

    cy.get(".message").should("have.length", 1);
    cy.get(".message").eq(0).find(".inline-audio").should("have.length", 1);

    cy.get(".inline-audio audio")
      .then(($el) => {
        const audioElement = $el.get(0) as HTMLAudioElement;
        return audioElement.play().then(() => {
          return audioElement.duration;
        });
      })
      .should("be.greaterThan", 0);
  });
});
