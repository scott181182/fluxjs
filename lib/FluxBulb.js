"use strict";
exports.__esModule = true;
var net = require("net");
var index_1 = require("./index");
var ON = 0x23;
var OFF = 0x24;
var PERSIST = 0x31;
var cmdGetState = makeCommand([0x81, 0x8a, 0x8b]);
var cmdGetTimers = makeCommand([0x22, 0x2a, 0x2b, 0x0f]);
var cmdOn = makeCommand([0x71, ON, 0x0f]);
var cmdOff = makeCommand([0x71, OFF, 0x0f]);
function byte(num) { return num & 0xff; }
function checksum(arr) { return byte(arr.reduce(function (acc, num) { return acc + num; }, 0)); }
function makeCommand(arr) {
    arr.push(checksum(arr));
    return Buffer.from(arr);
}
function bufstr(command) {
    return command.toJSON().data.map(function (value) { return (value < 16 ? "0" : "") + value.toString(16); }).join(",");
}
function sendCommandRaw(socket, command, keepalive) {
    if (keepalive === void 0) { keepalive = false; }
    return new Promise(function (resolve, reject) {
        if (keepalive) {
            socket.write(command, function (err) {
                if (err) {
                    return reject(err);
                }
                index_1.log.debug("   Sent: " + bufstr(command));
                resolve("write[" + bufstr(command) + "]");
            });
        }
        else {
            socket.end(command, function (err) {
                if (err) {
                    return reject(err);
                }
                index_1.log.debug("   Sent: " + bufstr(command));
                resolve("end[" + bufstr(command) + "]");
            });
        }
    });
}
function warmCommand(level) {
    return makeCommand([PERSIST, 0, 0, 0, level <= 1 ? Math.floor(level * 255) : level, 0x0f, 0x0f]);
}
function colorCommand(r, g, b) {
    return makeCommand([PERSIST, byte(r), byte(g), byte(b), 0x00, 0xf0, 0x0f]);
}
var FluxBulbState = (function () {
    function FluxBulbState(status) {
        this.on = status[2] === ON;
    }
    return FluxBulbState;
}());
exports.FluxBulbState = FluxBulbState;
var defaultPort = 5577;
var defaultOptions = {
    timeout: 5000
};
var FluxBulb = (function () {
    function FluxBulb(host, port, options) {
        if (port === void 0) { port = defaultPort; }
        this.host = host;
        this.port = port || defaultPort;
        this.opts = options || defaultOptions;
    }
    FluxBulb.prototype.connect = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var sock = net.connect(_this.port, _this.host, function () {
                resolve(sock);
            });
            sock.on("error", function (err) { reject(err); });
            sock.setTimeout(_this.opts.timeout, function () { reject("Timeout Error"); });
        });
    };
    FluxBulb.prototype.sendCommand = function (cmd) {
        return this.connect().then(function (sock) {
            sendCommandRaw(sock, cmd, false);
        });
    };
    FluxBulb.prototype.getState = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.connect().then(function (sock) {
                sock.once("data", function (stateData) {
                    sock.destroy();
                    resolve(new FluxBulbState(stateData));
                });
                sendCommandRaw(sock, cmdGetState, true);
            });
        });
    };
    FluxBulb.prototype.turn = function (on) { this.sendCommand(on ? cmdOn : cmdOff); };
    FluxBulb.prototype.turnOn = function () { this.turn(true); };
    FluxBulb.prototype.turnOff = function () { this.turn(false); };
    FluxBulb.prototype.setWarm = function (level) {
        this.sendCommand(warmCommand(level));
    };
    FluxBulb.prototype.setRGB = function (r, g, b) {
        this.sendCommand(colorCommand(r, g, b));
    };
    return FluxBulb;
}());
exports.FluxBulb = FluxBulb;
