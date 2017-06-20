import * as net from "net";
import { log } from "./index";

const ON      = 0x23;
const OFF     = 0x24;
const PERSIST = 0x31;

const cmdGetState  = makeCommand([0x81, 0x8a, 0x8b]);
const cmdGetTimers = makeCommand([0x22, 0x2a, 0x2b, 0x0f]);
const cmdOn        = makeCommand([0x71, ON,   0x0f]);
const cmdOff       = makeCommand([0x71, OFF,  0x0f]);

function checksum(arr: number[]): number {
    // tslint:disable-next-line:no-bitwise
    return arr.reduce((acc, num) => acc + num, 0) & 0xff;
}
function makeCommand(arr: number[]): Buffer {
    arr.push(checksum(arr));
    return Buffer.from(arr);
}
function bufstr(command: Buffer): string {
    return command.toJSON().data.map((value) => (value < 16 ? "0" : "") + value.toString(16)).join(",");
}

function sendCommand(socket: net.Socket, command: Buffer, keepalive = false): Promise<string> {
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
    })
}

function warmCommand(level: number): Buffer {
    return makeCommand([ PERSIST, 0, 0, 0, Math.floor(level * 255), 0x0f, 0x0f ]);
}
function colorCommand(r: number, g: number, b: number): Buffer {
    return makeCommand([ PERSIST, r, g, b, 0, 0xf0, 0x0f]);
}

interface Error {
    message: string;
    code: string;
    errno: string;
}



export type FluxBulbOptions = {
    timeout: number;
};
export class FluxBulbState
{
    public on: boolean;

    constructor(status: Buffer) {
        this.on = status[2] === ON;
    }
}

const defaultPort = 5577;
const defaultOptions: FluxBulbOptions = {
  timeout: 5000
};



export class FluxBulb
{
    private host: string;
    private port: number;
    private opts: FluxBulbOptions;
    private socket: net.Socket;

    constructor(host: string, port = defaultPort, options?: FluxBulbOptions) {
        this.host = host;
        this.port = port || defaultPort;
        this.opts = options || defaultOptions;

        log.debug(`Connecting to [${this.host}]...`);
        this.socket = net.connect(this.port, this.host, () => {
            log.debug(`Connected to [${this.host}]!`);
        });
        this.socket.setTimeout(this.opts.timeout, () => {
            log.error(`Connection timed out trying to connect to ${this.host}:${this.port}`);
            this.socket.destroy();
        });

        this.socket.on("error", (err: Error) => {
            log.error(err.code === "ECONNREFUSED"
                ? `Could not connect to FluxBulb@${this.host}`
                : `There was an error with the connection:\n${err.message}`);
        });
        this.socket.on("data", (data: Buffer) => {
            log.debug(`Data from [${host}]:`);
            log.debug(`   ${bufstr(data)}`);
        });
        this.socket.on("close", () => { log.debug(`Disconnected from [${this.host}].`); });
    }



    public getState(): Promise<FluxBulbState> {
        return new Promise((resolve, reject) => {
            this.socket.once("data", (stateData) => {
                resolve(new FluxBulbState(stateData));
            });
            sendCommand(this.socket, cmdGetState);
        });
    }

    public turn(on: boolean, atomic = false) {
        sendCommand(this.socket, on ? cmdOn : cmdOff, !atomic);
    }
    public turnOn(atomic = false) { this.turn(true, atomic); }
    public turnOff(atomic = false) { this.turn(false, atomic); }

    public setWarm(level: number, atomic = false) {
        sendCommand(this.socket, warmCommand(level), !atomic);
    }
    public setRGB(r: number, g: number, b: number, atomic = false) {
        sendCommand(this.socket, colorCommand(r, g, b), !atomic);
    }

    public close() { this.socket.end(); }
}
