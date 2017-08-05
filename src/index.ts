import * as program from "commander";
import { FluxBulb } from "./FluxBulb";

export * from "./FluxBulb";

/* tslint:disable:no-console */

export const ERROR = 0;
export const WARN  = 1;
export const INFO  = 2;
export const DEBUG = 3;

export let LEVEL = WARN;

export const log = {
    lethal: (msg: string) => {                      console.error(`[LETHAL] : ${msg}`); process.exit(1); },
    error:  (msg: string) => { if(LEVEL >= ERROR) { console.error(`[ERROR]  : ${msg}`); } },
    warn:   (msg: string) =>  { if(LEVEL >= WARN) { console.error(`[WARNING]: ${msg}`); } },
    info:   (msg: string) =>  { if(LEVEL >= INFO) { console.log(  `[info]   : ${msg}`); } },
    debug:  (msg: string) => { if(LEVEL >= DEBUG) { console.log(  `[debug]  : ${msg}`); } }
};

function set(obj: any, merge: any): any {
    if(!obj) { obj = {  }; }
    Object.keys(merge).forEach((key) => { obj[key] = merge[key]; });
    return obj;
}


const ValidIpAddressRegex
    = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
const ValidHostnameRegex
    = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;

async function main(args: string[])
{
    const hostname: string = args[2];
    let host: string;
    let port: number;
    if(hostname) {
        const frags = hostname.split(":");
        if(ValidIpAddressRegex.test(frags[0]) || ValidHostnameRegex.test(frags[0])) {
            host = frags[0];
            port = parseInt(frags[1]);
            args.splice(2, 1);
        }
    }

    let opts: any;
    program.version("0.1.0")
        .usage("<host[:port]> <command> [options] [args]")
        .option("-v, --verbose", "Log Verbose Output", () => { if(LEVEL < INFO) { LEVEL = INFO; } })
        .option("-d, --debug", "Log Debug Output", () => { if(LEVEL < DEBUG) { LEVEL = DEBUG; } })
        .option("-t, --timeout [milliseconds]", "Set FluxBulb connection timeout",
      (ms: string) => { opts = set(opts, { timeout: parseInt(ms) }); });

    program.command("status")
        .description("Get the current state of the bulb")
        .action(async () => {
            log.info("Getting state!");
            const bulb = new FluxBulb(host, port, opts);
            const state = await bulb.getState();
            console.log(state.toString());
        });
    program.command("on")
        .description("Turn the bulb on")
        .action(() => {
            const bulb = new FluxBulb(host, port, opts);
            bulb.turnOn();
        });
    program.command("off")
        .description("Turn the bulb off")
        .action(() => {
            const bulb = new FluxBulb(host, port, opts);
            bulb.turnOff();
        });
    program.command("warm")
        .description("Set the bulb to a warm white")
        .action((level) => {
            const bulb = new FluxBulb(host, port, opts);
            bulb.setWarm(level);
        });
    program.command("color")
        .description("Set the bulb to a certain color")
        .action((red, green, blue) => {
            const bulb = new FluxBulb(host, port, opts);
            bulb.setRGB(red, green, blue);
        });

    program.command("brighten")
        .description("Make the bulb brighter")
        .action((percent) => {
            const bulb = new FluxBulb(host, port, opts);
            bulb.brighten(percent);
        });
    program.command("darken")
        .description("Make the bulb darker")
        .action((percent) => {
            const bulb = new FluxBulb(host, port, opts);
            bulb.darken(percent);
        });

    if(!host) { console.log(program.usage()); }
    else { program.parse(args); }
}
if(require.main === module) { main(process.argv); }
