import { sep } from 'path';

import { ExecutionMode } from './utils';

export function submitMessage(message: string) {
  cy.wait(1000);
  cy.get(`#chat-input`).should('not.be.disabled');
  cy.get(`#chat-input`).type(`${message}{enter}`);
}

export function submitMessageCopilot(message: string) {
  cy.wait(1000);
  cy.get(`#copilot-chat-input`).should('not.be.disabled');
  cy.get(`#copilot-chat-input`).type(`${message}{enter}`, {
    scrollBehavior: false
  });
}

export function openHistory() {
  cy.wait(1000);
  cy.get(`#chat-input`).should('not.be.disabled');
  cy.get(`#chat-input`).type(`{upArrow}`);
}

export function closeHistory() {
  cy.get(`body`).click();
}

export function runTestServer(
  mode: ExecutionMode = undefined,
  env?: Record<string, string>
) {
  const pathItems = Cypress.spec.absolute.split(sep);
  const testName = pathItems[pathItems.length - 2];
  cy.exec(`pnpm exec ts-node ./cypress/support/run.ts ${testName} ${mode}`, {
    env
  });
  cy.visit('/');
}

export function describeSyncAsync(
  title: string,
  callback: (mode: ExecutionMode) => void
) {
  describe(`[sync] ${title}`, () => callback(ExecutionMode.Sync));
  describe(`[async] ${title}`, () => callback(ExecutionMode.Async));
}
