/// <reference types="node" />
export declare type FluxBulbOptions = {
    timeout: number;
};
export declare class FluxBulbState {
    on: boolean;
    constructor(status: Buffer);
}
export declare class FluxBulb {
    private host;
    private port;
    private opts;
    private socket;
    constructor(host: string, port?: number, options?: FluxBulbOptions);
    getState(): Promise<FluxBulbState>;
    turn(on: boolean, atomic?: boolean): void;
    turnOn(atomic?: boolean): void;
    turnOff(atomic?: boolean): void;
    setWarm(level: number, atomic?: boolean): void;
    setRGB(r: number, g: number, b: number, atomic?: boolean): void;
    close(): void;
}
