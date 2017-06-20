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
function checksum(arr) {
    return arr.reduce(function (acc, num) { return acc + num; }, 0) & 0xff;
}
function makeCommand(arr) {
    arr.push(checksum(arr));
    return Buffer.from(arr);
}
function bufstr(command) {
    return command.toJSON().data.map(function (value) { return (value < 16 ? "0" : "") + value.toString(16); }).join(",");
}
function sendCommand(socket, command, keepalive) {
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
    return makeCommand([PERSIST, 0, 0, 0, Math.floor(level * 255), 0x0f, 0x0f]);
}
function colorCommand(r, g, b) {
    return makeCommand([PERSIST, r, g, b, 0, 0xf0, 0x0f]);
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
        var _this = this;
        this.host = host;
        this.port = port || defaultPort;
        this.opts = options || defaultOptions;
        index_1.log.debug("Connecting to [" + this.host + "]...");
        this.socket = net.connect(this.port, this.host, function () {
            index_1.log.debug("Connected to [" + _this.host + "]!");
        });
        this.socket.setTimeout(this.opts.timeout, function () {
            index_1.log.error("Connection timed out trying to connect to " + _this.host + ":" + _this.port);
            _this.socket.destroy();
        });
        this.socket.on("error", function (err) {
            index_1.log.error(err.code === "ECONNREFUSED"
                ? "Could not connect to FluxBulb@" + _this.host
                : "There was an error with the connection:\n" + err.message);
        });
        this.socket.on("data", function (data) {
            index_1.log.debug("Data from [" + host + "]:");
            index_1.log.debug("   " + bufstr(data));
        });
        this.socket.on("close", function () { index_1.log.debug("Disconnected from [" + _this.host + "]."); });
    }
    FluxBulb.prototype.getState = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.socket.once("data", function (stateData) {
                resolve(new FluxBulbState(stateData));
            });
            sendCommand(_this.socket, cmdGetState);
        });
    };
    FluxBulb.prototype.turn = function (on, atomic) {
        if (atomic === void 0) { atomic = false; }
        sendCommand(this.socket, on ? cmdOn : cmdOff, !atomic);
    };
    FluxBulb.prototype.turnOn = function (atomic) {
        if (atomic === void 0) { atomic = false; }
        this.turn(true, atomic);
    };
    FluxBulb.prototype.turnOff = function (atomic) {
        if (atomic === void 0) { atomic = false; }
        this.turn(false, atomic);
    };
    FluxBulb.prototype.setWarm = function (level, atomic) {
        if (atomic === void 0) { atomic = false; }
        sendCommand(this.socket, warmCommand(level), !atomic);
    };
    FluxBulb.prototype.setRGB = function (r, g, b, atomic) {
        if (atomic === void 0) { atomic = false; }
        sendCommand(this.socket, colorCommand(r, g, b), !atomic);
    };
    FluxBulb.prototype.close = function () { this.socket.end(); };
    return FluxBulb;
}());
exports.FluxBulb = FluxBulb;
