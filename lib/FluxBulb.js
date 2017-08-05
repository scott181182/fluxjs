"use strict";
exports.__esModule = true;
var net = require("net");
var index_1 = require("./index");
var ON = 0x23;
var OFF = 0x24;
var PERSIST = 0x31;
var MODE_CUSTOM = 0x60;
var MODE_NORM1 = 0x61;
var MODE_NORM2 = 0x62;
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
function padnum(num, radix) {
    if (radix === void 0) { radix = 10; }
    return num < radix ? "0" + num.toString(radix) : num.toString(radix);
}
var Color = (function () {
    function Color(red, green, blue) {
        this.red = red;
        this.green = green;
        this.blue = blue;
        if (red < 0) {
            this.red = 0;
        }
        else if (red > 255) {
            this.red = 255;
        }
        if (green < 0) {
            this.green = 0;
        }
        else if (green > 255) {
            this.green = 255;
        }
        if (blue < 0) {
            this.blue = 0;
        }
        else if (blue > 255) {
            this.blue = 255;
        }
    }
    Color.prototype.brightness = function () {
        var nr = this.red / 255;
        var ng = this.green / 255;
        var nb = this.blue / 255;
        return Math.sqrt((0.299 * nr * nr) + (0.587 * ng * ng) + (0.114 * nb * nb));
    };
    Color.prototype.darker = function (percent) {
        return new Color(this.red * (1 - percent), this.green * (1 - percent), this.blue * (1 - percent));
    };
    Color.prototype.lighter = function (percent) {
        var rAugment = (255 - this.red) * percent;
        var gAugment = (255 - this.green) * percent;
        var bAugment = (255 - this.blue) * percent;
        return new Color(this.red + rAugment, this.green + gAugment, this.blue + bAugment);
    };
    Color.prototype.toString = function () {
        return "#" + padnum(this.red, 16) + padnum(this.green, 16) + padnum(this.blue, 16);
    };
    return Color;
}());
exports.Color = Color;
var PresetPatterns;
(function (PresetPatterns) {
    PresetPatterns[PresetPatterns["SevenColorCrossFade"] = 37] = "SevenColorCrossFade";
    PresetPatterns[PresetPatterns["RedGradualChange"] = 38] = "RedGradualChange";
    PresetPatterns[PresetPatterns["GreenGradualChange"] = 39] = "GreenGradualChange";
    PresetPatterns[PresetPatterns["BlueGradualChange"] = 40] = "BlueGradualChange";
    PresetPatterns[PresetPatterns["YellowGradualChange"] = 41] = "YellowGradualChange";
    PresetPatterns[PresetPatterns["CyanGradualChange"] = 42] = "CyanGradualChange";
    PresetPatterns[PresetPatterns["PurpleGradualChange"] = 43] = "PurpleGradualChange";
    PresetPatterns[PresetPatterns["WhiteGradualChange"] = 44] = "WhiteGradualChange";
    PresetPatterns[PresetPatterns["RedGreenCrossFade"] = 45] = "RedGreenCrossFade";
    PresetPatterns[PresetPatterns["RedBlueCrossFade"] = 46] = "RedBlueCrossFade";
    PresetPatterns[PresetPatterns["GreenBlueCrossFade"] = 47] = "GreenBlueCrossFade";
    PresetPatterns[PresetPatterns["SevenColorStrobeFlash"] = 48] = "SevenColorStrobeFlash";
    PresetPatterns[PresetPatterns["RedStrobeFlash"] = 49] = "RedStrobeFlash";
    PresetPatterns[PresetPatterns["GreenStrobeFlash"] = 50] = "GreenStrobeFlash";
    PresetPatterns[PresetPatterns["BlueStobeFlash"] = 51] = "BlueStobeFlash";
    PresetPatterns[PresetPatterns["YellowStrobeFlash"] = 52] = "YellowStrobeFlash";
    PresetPatterns[PresetPatterns["CyanStrobeFlash"] = 53] = "CyanStrobeFlash";
    PresetPatterns[PresetPatterns["PurpleStrobeFlash"] = 54] = "PurpleStrobeFlash";
    PresetPatterns[PresetPatterns["WhiteStrobeFlash"] = 55] = "WhiteStrobeFlash";
    PresetPatterns[PresetPatterns["SevenColorJumping"] = 56] = "SevenColorJumping";
})(PresetPatterns = exports.PresetPatterns || (exports.PresetPatterns = {}));
var FluxBulbState = (function () {
    function FluxBulbState(status) {
        this.on = status[2] === ON;
        var pattern = status[3];
        var level = status[9];
        this.mode = "unknown";
        this.determineMode(pattern, level);
        switch (this.mode) {
            case "ww":
                this.brightness = level / 255;
                break;
            case "color":
                this.color = new Color(status[6], status[7], status[8]);
                this.brightness = this.color.brightness();
                break;
        }
    }
    FluxBulbState.prototype.determineMode = function (pattern, level) {
        if (pattern === MODE_NORM1 || pattern === MODE_NORM2) {
            this.mode = level === 0 ? "color" : "ww";
        }
        else if (pattern === MODE_CUSTOM) {
            this.mode = "custom";
        }
        else if (this.isPresetPattern(pattern)) {
            this.mode = "preset";
            this.pattern = PresetPatterns[pattern];
        }
    };
    FluxBulbState.prototype.isPresetPattern = function (pattern) { return pattern >= 0x25 && pattern <= 0x38; };
    FluxBulbState.prototype.toString = function () {
        var str = "FluxBulbState(on=" + this.on + ",mode=" + this.mode;
        if (this.mode === "color") {
            str += ",brightness=" + Math.round(this.brightness * 100) + "%,color=" + this.color.toString() + ")";
        }
        else if (this.mode === "ww") {
            str += ",brightness=" + Math.round(this.brightness * 100) + "%)";
        }
        else if (this.mode === "preset") {
            str += ",pattern=" + this.pattern + ")";
        }
        else {
            str += ")";
        }
        return str;
    };
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
    FluxBulb.prototype.setColor = function (color) {
        this.setRGB(color.red, color.green, color.blue);
    };
    FluxBulb.prototype.setRGB = function (r, g, b) {
        this.sendCommand(colorCommand(r, g, b));
    };
    FluxBulb.prototype.darken = function (percent) {
        var _this = this;
        this.getState().then(function (state) {
            if (state.mode === "ww") {
                _this.setWarm(Math.max(0, state.brightness * (1 - percent)));
            }
            else if (state.mode === "color") {
                _this.setColor(state.color.darker(percent));
            }
        });
    };
    FluxBulb.prototype.brighten = function (percent) {
        var _this = this;
        this.getState().then(function (state) {
            if (state.mode === "ww") {
                _this.setWarm(Math.min(1, state.brightness * (1 + percent)));
            }
            else if (state.mode === "color") {
                _this.setColor(state.color.lighter(percent));
            }
        });
    };
    return FluxBulb;
}());
exports.FluxBulb = FluxBulb;
