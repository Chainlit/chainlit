'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: []
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.runCommand =
  exports.runTests =
  exports.ExecutionMode =
  exports.CHAINLIT_PORT =
  exports.BACKEND_DIR =
  exports.E2E_DIR =
    void 0;
var child_process_1 = require('child_process');
var path_1 = require('path');
var ROOT = process.cwd();
exports.E2E_DIR = (0, path_1.join)(ROOT, 'cypress/e2e');
exports.BACKEND_DIR = (0, path_1.join)(ROOT, 'backend');
exports.CHAINLIT_PORT = 8000;
var ExecutionMode;
(function (ExecutionMode) {
  ExecutionMode['Async'] = 'async';
  ExecutionMode['Sync'] = 'sync';
})(ExecutionMode || (exports.ExecutionMode = ExecutionMode = {}));
function runTests(matchName) {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      // Cypress requires a healthcheck on the server at startup so let's run
      // Chainlit before running tests to pass the healthcheck
      runCommand('pnpm exec ts-node ./cypress/support/run.ts action');
      // Recording the cypress run is time consuming. Disabled by default.
      // const recordOptions = ` --record --key ${process.env.CYPRESS_RECORD_KEY} `;
      return [
        2 /*return*/,
        runCommand(
          'pnpm exec cypress run --record false --spec "cypress/e2e/'.concat(
            matchName,
            '/spec.cy.ts"'
          )
        )
      ];
    });
  });
}
exports.runTests = runTests;
function runCommand(command, cwd) {
  if (cwd === void 0) {
    cwd = ROOT;
  }
  return (0, child_process_1.execSync)(command, {
    encoding: 'utf-8',
    cwd: cwd,
    env: process.env,
    stdio: 'inherit'
  });
}
exports.runCommand = runCommand;
