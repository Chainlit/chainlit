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
exports.runChainlitForTest = void 0;
var child_process_1 = require('child_process');
var kill = require('kill-port');
var path_1 = require('path');
var shell_exec_1 = require('shell-exec');
var utils_1 = require('./utils');
var killPort = function (port) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      if (process.platform === 'win32') return [2 /*return*/, kill(port)];
      return [
        2 /*return*/,
        (0, shell_exec_1.default)('lsof -nPi :'.concat(port)).then(function (
          res
        ) {
          var stdout = res.stdout;
          if (!stdout)
            return Promise.reject('No process running on port '.concat(port));
          return (0, shell_exec_1.default)(
            'lsof -nPi :'.concat(
              port,
              " | grep 'LISTEN' | awk '{print $2}' | xargs kill -9"
            )
          );
        })
      ];
    });
  });
};
var runChainlitForTest = function (testName, mode) {
  return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 2, , 3]);
          return [4 /*yield*/, killPort(utils_1.CHAINLIT_PORT)];
        case 1:
          _a.sent();
          console.log(
            'Process on port '.concat(utils_1.CHAINLIT_PORT, ' killed')
          );
          return [3 /*break*/, 3];
        case 2:
          error_1 = _a.sent();
          console.log(
            'Could not kill process on port '
              .concat(utils_1.CHAINLIT_PORT, '. ')
              .concat(error_1, '.')
          );
          return [3 /*break*/, 3];
        case 3:
          return [
            2 /*return*/,
            new Promise(function (resolve, reject) {
              var dir = (0, path_1.join)(utils_1.E2E_DIR, testName);
              var file = 'main.py';
              if (mode === utils_1.ExecutionMode.Async) file = 'main_async.py';
              if (mode === utils_1.ExecutionMode.Sync) file = 'main_sync.py';
              // Headless + CI mode
              var options = [
                'run',
                '-C',
                utils_1.BACKEND_DIR,
                'chainlit',
                'run',
                file,
                '-h',
                '-c'
              ];
              var server = (0, child_process_1.spawn)('poetry', options, {
                cwd: dir
              });
              server.stdout.on('data', function (data) {
                console.log('stdout: '.concat(data));
                if (data.toString().includes('Your app is available at')) {
                  resolve(server);
                }
              });
              server.stderr.on('data', function (data) {
                console.error('stderr: '.concat(data));
              });
              server.on('error', function (error) {
                reject(error.message);
              });
              server.on('exit', function (code) {
                reject('child process exited with code ' + code);
              });
            })
          ];
      }
    });
  });
};
exports.runChainlitForTest = runChainlitForTest;
(0, exports.runChainlitForTest)(process.argv[2], process.argv[3])
  .then(function () {
    process.exit(0);
  })
  .catch(function (error) {
    console.error(error);
    process.exit(1);
  });
