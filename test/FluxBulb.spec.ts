import "mocha";
import * as chai from "chai";
import rewire = require("rewire");

const flux = rewire("../src/FluxBulb");

const expect = chai.expect;

describe("FluxBulb static", () => {
    describe("#checksum()", () => {
        it("should exist", () => {
            const checksum = flux.__get__<(arr: number[]) => number>("checksum");
            expect(checksum).to.not.be.undefined;
        });
        it("should make checksum for literal cmdOn", () => {
            const cmd = [ 0x71, 0x23, 0x0f ];
            const exp = 0xa3;

            const checksum = flux.__get__<(arr: number[]) => number>("checksum");
            const check = checksum(cmd);
            expect(check).to.eq(exp);
        });
        it("should be one byte", () => {
            const cmd = [ 0xffff ];
            const exp = 0xff;

            const checksum = flux.__get__<(arr: number[]) => number>("checksum");
            const check = checksum(cmd);
            expect(check).to.eq(exp);
        });
    });
    describe("#makeCommand()", () => {
        it("should exist", () => {
            const makeCommand = flux.__get__<(arr: number[]) => Buffer>("makeCommand");
            expect(makeCommand).to.not.be.undefined;
        });
        it("make cmdOn", () => {
            const exp = Buffer.from([ 0x71, 0x23, 0x0f, 0xa3 ]);

            const cmdOn = flux.__get__<Buffer>("cmdOn");
            expect(cmdOn).to.deep.equal(exp);
        });
    });
    describe("#bufstr()", () => {
        it("should exist", () => {
            const bufstr = flux.__get__<(command: Buffer) => string>("bufstr");
            expect(bufstr).to.not.be.undefined;
        });
        it("make buffer string", () => {
            const buffer = Buffer.from([ 0x01, 0x23, 0x45, 0x67, 0x89, 0x10 ]);
            const bufstr = flux.__get__<(command: Buffer) => string>("bufstr");

            const result = bufstr(buffer);
            expect(result).to.deep.equal("01,23,45,67,89,10");
        });
        it("make cmdOff string", () => {
            const cmdOff = flux.__get__<Buffer>("cmdOff");
            const bufstr = flux.__get__<(command: Buffer) => string>("bufstr");

            const result = bufstr(cmdOff);
            expect(result).to.deep.equal("71,24,0f,a4");
        });
    });

    describe("#sendCommand()", () => {
        const dummySocket = {
            write: (buffer: Buffer, cb: () => void) => { cb(); },
            end: (buffer: Buffer, cb: () => void) => { cb(); }
        };

        it("should exist", () => {
            const sendCommand = flux.__get__<(socket: any, command: Buffer, keepalive: boolean) => void>("sendCommand");
            expect(sendCommand).to.not.be.undefined;
        });
        it("should write data atomically", async () => {
            const sendCommand = flux.__get__<(socket: any, command: Buffer, keepalive: boolean) => void>("sendCommand");
            const result = await sendCommand(dummySocket, Buffer.from([ 0x01 ]), false);
            expect(result).to.equal("end[01]");
        });
        it("should write data and keep alive", async () => {
            const sendCommand = flux.__get__<(socket: any, command: Buffer, keepalive: boolean) => void>("sendCommand");
            const result = await sendCommand(dummySocket, Buffer.from([ 0x01 ]), true);
            expect(result).to.equal("write[01]");
        });
    });
    describe("#warmCommand()", () => {
        it("should exist", () => {
            const warmCommand = flux.__get__<(level: number) => Buffer>("warmCommand");
            expect(warmCommand).to.not.be.undefined;
        });
        it("should make a maximum brightness warm command", async () => {
            const exp = Buffer.from([ 0x31, 0, 0, 0, 255, 0x0f, 0x0f, 0x4e ]);

            const warmCommand = flux.__get__<(level: number) => Buffer>("warmCommand");
            const result = warmCommand(1);
            expect(result).to.deep.equal(exp);
        });
        it("should make a minimum brightness warm command", async () => {
            const exp = Buffer.from([ 0x31, 0, 0, 0, 0, 0x0f, 0x0f, 0x4f ]);

            const warmCommand = flux.__get__<(level: number) => Buffer>("warmCommand");
            const result = warmCommand(0);
            expect(result).to.deep.equal(exp);
        });
        it("should make a medium brightness warm command", async () => {
            const exp = Buffer.from([ 0x31, 0, 0, 0, 127, 0x0f, 0x0f, 0xce ]);

            const warmCommand = flux.__get__<(level: number) => Buffer>("warmCommand");
            const result = warmCommand(0.5);
            expect(result).to.deep.equal(exp);
        });
    });
    describe("#colorCommand()", () => {
        it("should exist", () => {
            const colorCommand = flux.__get__<(r: number, g: number, b: number) => Buffer>("colorCommand");
            expect(colorCommand).to.not.be.undefined;
        });
        it("should make a white color command", async () => {
            const exp = Buffer.from([ 0x31, 0xff, 0xff, 0xff, 0, 0xf0, 0x0f, 0x2d]);

            const colorCommand = flux.__get__<(r: number, g: number, b: number) => Buffer>("colorCommand");
            const result = colorCommand(255, 255, 255);
            expect(result).to.deep.equal(exp);
        });
        it("should make a red color command", async () => {
            const exp = Buffer.from([ 0x31, 0xff, 0, 0, 0, 0xf0, 0x0f, 0x2f ]);

            const colorCommand = flux.__get__<(r: number, g: number, b: number) => Buffer>("colorCommand");
            const result = colorCommand(255, 0, 0);
            expect(result).to.deep.equal(exp);
        });
        it("should make a cyan color command", async () => {
            const exp = Buffer.from([ 0x31, 0, 0xff, 0xff, 0, 0xf0, 0x0f, 0x2e ]);

            const colorCommand = flux.__get__<(r: number, g: number, b: number) => Buffer>("colorCommand");
            const result = colorCommand(0, 255, 255);
            expect(result).to.deep.equal(exp);
        });
    });
});

describe("FluxBulb", () => {
    let prevCommand: Buffer;
    const dummySocket = {
        setTimeout: (ms: number, cb: Function) => {  },
        on: (code: string, obj: any) => {  },
        write: (buffer: Buffer, cb: () => void) => { prevCommand = buffer; cb(); },
        end: (buffer: Buffer, cb: () => void) => { prevCommand = buffer; cb(); }
    };

    const FluxBulb = flux.__get__("FluxBulb");
    flux.__set__("net", {
        connect: (port: number, host: string, cb: Function) => { return dummySocket; },
    });

    describe("#constructor()", () => {
        it("should have default port", () => {
            const defaultPort = flux.__get__<number>("defaultPort");

            const bulb = new FluxBulb("127.0.0.1");
            expect(bulb.port).to.equal(defaultPort);
        });
    });

    describe("#turn()", () => {
        it("should try to turn on", async () => {
            const cmdOn = flux.__get__<Buffer>("cmdOn");

            const bulb = new FluxBulb("127.0.0.1");
            bulb.turn(true);
            expect(prevCommand).to.deep.equal(cmdOn);
        });
        it("should try to turn off", async () => {
            const cmdOff = flux.__get__<Buffer>("cmdOff");

            const bulb = new FluxBulb("127.0.0.1");
            bulb.turn(false);
            expect(prevCommand).to.deep.equal(cmdOff);
        });
    });
    describe("#turnOn()", () => {
        it("should try to turn on", async () => {
            const cmdOn = flux.__get__<Buffer>("cmdOn");

            const bulb = new FluxBulb("127.0.0.1");
            bulb.turnOn();
            expect(prevCommand).to.deep.equal(cmdOn);
        });
    });
    describe("#turnOff()", () => {
        it("should try to turn off", async () => {
            const cmdOff = flux.__get__<Buffer>("cmdOff");

            const bulb = new FluxBulb("127.0.0.1");
            bulb.turnOff();
            expect(prevCommand).to.deep.equal(cmdOff);
        });
    });
});
