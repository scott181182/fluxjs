import * as net from "net";
import { log } from "./index";

const ON      = 0x23;
const OFF     = 0x24;
const PERSIST = 0x31;

const MODE_CUSTOM = 0x60;
const MODE_NORM1  = 0x61;
const MODE_NORM2  = 0x62;

const cmdGetState  = makeCommand([0x81, 0x8a, 0x8b]);
const cmdGetTimers = makeCommand([0x22, 0x2a, 0x2b, 0x0f]);
const cmdOn        = makeCommand([0x71, ON,   0x0f]);
const cmdOff       = makeCommand([0x71, OFF,  0x0f]);

// tslint:disable-next-line:no-bitwise
function byte(num: number): number { return num & 0xff; }

function checksum(arr: number[]): number { return byte(arr.reduce((acc, num) => acc + num, 0)); }
function makeCommand(arr: number[]): Buffer {
    arr.push(checksum(arr));
    return Buffer.from(arr);
}
function bufstr(command: Buffer): string {
    return command.toJSON().data.map((value) => (value < 16 ? "0" : "") + value.toString(16)).join(",");
}

function sendCommandRaw(socket: net.Socket, command: Buffer, keepalive = false): Promise<string> {
    return new Promise((resolve, reject) => {
        if(keepalive) { socket.write(command, (err: Error) => {
            if(err) { return reject(err); }
            log.debug(`   Sent: ${bufstr(command)}`);
            resolve(`write[${bufstr(command)}]`);
        }); }
        else { socket.end(command, (err: Error) => {
            if(err) { return reject(err); }
            log.debug(`   Sent: ${bufstr(command)}`);
            resolve(`end[${bufstr(command)}]`);
        }); }
    });
}

function warmCommand(level: number): Buffer {
    return makeCommand([ PERSIST, 0, 0, 0, level <= 1 ? Math.floor(level * 255) : level, 0x0f, 0x0f ]);
}
function colorCommand(r: number, g: number, b: number): Buffer {
    return makeCommand([ PERSIST, byte(r), byte(g), byte(b), 0x00, 0xf0, 0x0f]);
}
function padnum(num: number, radix = 10): string {
    return num < radix ? `0${num.toString(radix)}` : num.toString(radix);
}

interface Error {
    message: string;
    code: string;
    errno: string;
}
export class Color
{
    constructor(
        public red:   number,
        public green: number,
        public blue:  number
    ) {
        if(red   < 0) { this.red   = 0; } else if(red   > 255) { this.red   = 255; }
        if(green < 0) { this.green = 0; } else if(green > 255) { this.green = 255; }
        if(blue  < 0) { this.blue  = 0; } else if(blue  > 255) { this.blue  = 255; }
    }

    public brightness(): number {
        const nr = this.red   / 255;
        const ng = this.green / 255;
        const nb = this.blue  / 255;
        return Math.sqrt((0.299 * nr * nr) + (0.587 * ng * ng) + (0.114 * nb * nb));
    }

    public darker(percent: number): Color {
        return new Color(
            this.red   * (1 - percent),
            this.green * (1 - percent),
            this.blue  * (1 - percent)
        );
    }
    public lighter(percent: number): Color {
        const rAugment = (255 - this.red  ) * percent;
        const gAugment = (255 - this.green) * percent;
        const bAugment = (255 - this.blue ) * percent;
        return new Color(
            this.red   + rAugment,
            this.green + gAugment,
            this.blue  + bAugment
        );
    }

    public toString(): string {
        return `#${padnum(this.red, 16)}${padnum(this.green, 16)}${padnum(this.blue, 16)}`;
    }
}

export enum PresetPatterns
{
    SevenColorCrossFade =   0x25,
	RedGradualChange =      0x26,
	GreenGradualChange =    0x27,
	BlueGradualChange =     0x28,
	YellowGradualChange =   0x29,
	CyanGradualChange =     0x2a,
	PurpleGradualChange =   0x2b,
	WhiteGradualChange =    0x2c,
	RedGreenCrossFade =     0x2d,
	RedBlueCrossFade =      0x2e,
	GreenBlueCrossFade =    0x2f,
	SevenColorStrobeFlash = 0x30,
	RedStrobeFlash =        0x31,
	GreenStrobeFlash =      0x32,
	BlueStobeFlash =        0x33,
	YellowStrobeFlash =     0x34,
	CyanStrobeFlash =       0x35,
	PurpleStrobeFlash =     0x36,
	WhiteStrobeFlash =      0x37,
	SevenColorJumping =     0x38
}



export type FluxBulbMode = "unknown" | "ww" | "color" | "preset" | "custom";
export class FluxBulbState
{
    public on: boolean;
    public mode: FluxBulbMode;
    public brightness: number;

    public pattern?: string;
    public color?: Color;

    constructor(status: Buffer) {
        this.on = status[2] === ON;
        const pattern = status[3];
        const level = status[9];

        this.mode = "unknown";
        this.determineMode(pattern, level);

        switch(this.mode)
        {
            case "ww" as FluxBulbMode:
                this.brightness = level / 255;
                break;
            case "color" as FluxBulbMode:
                this.color = new Color(status[6], status[7], status[8]);
                this.brightness = this.color.brightness();
                break;
        }
    }

    private determineMode(pattern: number, level: number)
    {

        if(pattern === MODE_NORM1 || pattern === MODE_NORM2) {
            this.mode = level === 0 ? "color" : "ww";
        }
        else if(pattern === MODE_CUSTOM) { this.mode = "custom"; }
        else if(this.isPresetPattern(pattern)) {
            this.mode = "preset";
            this.pattern = PresetPatterns[pattern];
        }
    }
    private isPresetPattern(pattern: number) { return pattern >= 0x25 && pattern <= 0x38; }

    public toString(): string
    {
        let str = `FluxBulbState(on=${this.on},mode=${this.mode}`;
        if(this.mode === "color") {
            str += `,brightness=${Math.round(this.brightness * 100)}%,color=${this.color.toString()})`;
        } else if(this.mode === "ww") {
            str += `,brightness=${Math.round(this.brightness * 100)}%)`;
        } else if(this.mode === "preset") {
            str += `,pattern=${this.pattern})`;
        } else {
            str += ")";
        }
        return str;
    }
}



export type FluxBulbOptions = {
    timeout: number;
};

const defaultPort = 5577;
const defaultOptions: FluxBulbOptions = {
  timeout: 5000
};

export class FluxBulb
{
    private host: string;
    private port: number;
    public opts: FluxBulbOptions;

    constructor(host: string, port = defaultPort, options?: FluxBulbOptions) {
        this.host = host;
        this.port = port || defaultPort;
        this.opts = options || defaultOptions;
    }
    private connect(): Promise<net.Socket>
    {
        return new Promise((resolve, reject) => {
            const sock = net.connect(this.port, this.host, () => {
                resolve(sock);
            });
            sock.on("error", (err: Error) => { reject(err); });
            sock.setTimeout(this.opts.timeout, () => { reject("Timeout Error"); });
        });
    }
    private sendCommand(cmd: Buffer)
    {
        return this.connect().then((sock) => {
            sendCommandRaw(sock, cmd, false);
        });
    }


    public getState(): Promise<FluxBulbState> {
        return new Promise((resolve, reject) => {
            this.connect().then((sock) => {
                sock.once("data", (stateData) => {
                    sock.destroy();
                    resolve(new FluxBulbState(stateData));
                });
                sendCommandRaw(sock, cmdGetState, true);
            });
        });
    }

    public turn(on: boolean) { this.sendCommand(on ? cmdOn : cmdOff); }
    public turnOn() { this.turn(true); }
    public turnOff() { this.turn(false); }

    public setWarm(level: number) {
        this.sendCommand(warmCommand(level));
    }
    public setColor(color: Color) {
        this.setRGB(color.red, color.green, color.blue);
    }
    public setRGB(r: number, g: number, b: number) {
        this.sendCommand(colorCommand(r, g, b));
    }

    public darken(percent: number)
    {
        this.getState().then((state) => {
            if(state.mode === "ww") {
                this.setWarm(Math.max(0, state.brightness * (1 - percent)));
            } else if(state.mode === "color") {
                this.setColor(state.color.darker(percent));
            }
        });
    }
    public brighten(percent: number)
    {
        this.getState().then((state) => {
            if(state.mode === "ww") {
                this.setWarm(Math.min(1, state.brightness * (1 + percent)));
            } else if(state.mode === "color") {
                this.setColor(state.color.lighter(percent));
            }
        });
    }
}
