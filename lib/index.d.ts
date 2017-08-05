export * from "./FluxBulb";
export declare const ERROR = 0;
export declare const WARN = 1;
export declare const INFO = 2;
export declare const DEBUG = 3;
export declare let LEVEL: number;
export declare const log: {
    lethal: (msg: string) => void;
    error: (msg: string) => void;
    warn: (msg: string) => void;
    info: (msg: string) => void;
    debug: (msg: string) => void;
};
