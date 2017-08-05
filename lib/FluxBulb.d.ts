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
    constructor(host: string, port?: number, options?: FluxBulbOptions);
    private connect();
    private sendCommand(cmd);
    getState(): Promise<FluxBulbState>;
    turn(on: boolean): void;
    turnOn(): void;
    turnOff(): void;
    setWarm(level: number): void;
    setRGB(r: number, g: number, b: number): void;
}
