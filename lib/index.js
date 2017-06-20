"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
exports.__esModule = true;
var program = require("commander");
var FluxBulb_1 = require("./FluxBulb");
__export(require("./FluxBulb"));
var ERROR = 0;
var WARN = 1;
var INFO = 2;
var DEBUG = 3;
var LEVEL = WARN;
exports.log = {
    lethal: function (msg) { console.error("[LETHAL] : " + msg); process.exit(1); },
    error: function (msg) { if (LEVEL >= ERROR) {
        console.error("[ERROR]  : " + msg);
    } },
    warn: function (msg) { if (LEVEL >= WARN) {
        console.error("[WARNING]: " + msg);
    } },
    info: function (msg) { if (LEVEL >= INFO) {
        console.log("[info]   : " + msg);
    } },
    debug: function (msg) { if (LEVEL >= DEBUG) {
        console.log("[debug]  : " + msg);
    } }
};
function set(obj, merge) {
    if (!obj) {
        obj = {};
    }
    Object.keys(merge).forEach(function (key) { obj[key] = merge[key]; });
    return obj;
}
var ValidIpAddressRegex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
var ValidHostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
function main(args) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        var hostname, host, port, frags, opts;
        return __generator(this, function (_a) {
            hostname = args[2];
            if (hostname.split) {
                frags = hostname.split(":");
                if (ValidIpAddressRegex.test(frags[0]) || ValidHostnameRegex.test(frags[0])) {
                    host = frags[0];
                    port = parseInt(frags[1]);
                    args.splice(2, 1);
                }
            }
            program.version("0.1.0")
                .usage("<host[:port]> <command> [options] [args]")
                .option("-v, --verbose", "Log Verbose Output", function () { if (LEVEL < INFO) {
                LEVEL = INFO;
            } })
                .option("-d, --debug", "Log Debug Output", function () { if (LEVEL < DEBUG) {
                LEVEL = DEBUG;
            } })
                .option("-t, --timeout [milliseconds]", "Set FluxBulb connection timeout", function (ms) { opts = set(opts, { timeout: parseInt(ms) }); });
            program.command("status")
                .description("Get the current state of the bulb")
                .action(function () { return __awaiter(_this, void 0, void 0, function () {
                var bulb, state;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            exports.log.info("Getting state!");
                            bulb = new FluxBulb_1.FluxBulb(host, port, opts);
                            return [4, bulb.getState()];
                        case 1:
                            state = _a.sent();
                            console.log("   On: " + state.on);
                            bulb.close();
                            return [2];
                    }
                });
            }); });
            program.command("on")
                .description("Turn the bulb on")
                .action(function () {
                var bulb = new FluxBulb_1.FluxBulb(host, port, opts);
                bulb.turnOn(true);
            });
            program.command("off")
                .description("Turn the bulb off")
                .action(function () {
                var bulb = new FluxBulb_1.FluxBulb(host, port, opts);
                bulb.turnOff(true);
            });
            program.command("warm")
                .description("Set the bulb to a warm white")
                .action(function (level) {
                var bulb = new FluxBulb_1.FluxBulb(host, port, opts);
                bulb.setWarm(level, true);
            });
            if (!host) {
                return [2, program.usage()];
            }
            program.parse(args);
            return [2];
        });
    });
}
if (require.main === module) {
    main(process.argv);
}
