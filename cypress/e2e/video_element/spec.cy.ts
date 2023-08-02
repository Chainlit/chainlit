describe("video", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should be able to display a video element", () => {
    cy.get("#welcome-screen").should("exist");

    cy.get(".message").should("have.length", 1);
    cy.get(".message").eq(0).find(".inline-video").should("have.length", 1);

    cy.get("video.inline-video").then(($el) => {
      const videoElement = $el.get(0) as HTMLVideoElement;
      return videoElement.play().then(() => {
        return videoElement.duration;
      });
    }).should("be.greaterThan", 0);
  });
});
