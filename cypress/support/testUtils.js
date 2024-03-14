'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.describeSyncAsync =
  exports.runTestServer =
  exports.closeHistory =
  exports.openHistory =
  exports.submitMessageCopilot =
  exports.submitMessage =
    void 0;
var path_1 = require('path');
var utils_1 = require('./utils');
function submitMessage(message) {
  cy.wait(1000);
  cy.get('#chat-input').should('not.be.disabled');
  cy.get('#chat-input').type(''.concat(message, '{enter}'));
}
exports.submitMessage = submitMessage;
function submitMessageCopilot(message) {
  cy.wait(1000);
  cy.get('#copilot-chat-input').should('not.be.disabled');
  cy.get('#copilot-chat-input').type(''.concat(message, '{enter}'), {
    scrollBehavior: false
  });
}
exports.submitMessageCopilot = submitMessageCopilot;
function openHistory() {
  cy.wait(1000);
  cy.get('#chat-input').should('not.be.disabled');
  cy.get('#chat-input').type('{upArrow}');
}
exports.openHistory = openHistory;
function closeHistory() {
  cy.get('body').click();
}
exports.closeHistory = closeHistory;
function runTestServer(mode, env) {
  if (mode === void 0) {
    mode = undefined;
  }
  var pathItems = Cypress.spec.absolute.split(path_1.sep);
  var testName = pathItems[pathItems.length - 2];
  cy.exec(
    'pnpm exec ts-node ./cypress/support/run.ts '
      .concat(testName, ' ')
      .concat(mode),
    {
      env: env
    }
  );
  cy.visit('/');
}
exports.runTestServer = runTestServer;
function describeSyncAsync(title, callback) {
  describe('[sync] '.concat(title), function () {
    return callback(utils_1.ExecutionMode.Sync);
  });
  describe('[async] '.concat(title), function () {
    return callback(utils_1.ExecutionMode.Async);
  });
}
exports.describeSyncAsync = describeSyncAsync;
