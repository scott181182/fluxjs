/// <reference types="node" />
export declare class Color {
    red: number;
    green: number;
    blue: number;
    constructor(red: number, green: number, blue: number);
    brightness(): number;
    darker(percent: number): Color;
    lighter(percent: number): Color;
    toString(): string;
}
export declare enum PresetPatterns {
    SevenColorCrossFade = 37,
    RedGradualChange = 38,
    GreenGradualChange = 39,
    BlueGradualChange = 40,
    YellowGradualChange = 41,
    CyanGradualChange = 42,
    PurpleGradualChange = 43,
    WhiteGradualChange = 44,
    RedGreenCrossFade = 45,
    RedBlueCrossFade = 46,
    GreenBlueCrossFade = 47,
    SevenColorStrobeFlash = 48,
    RedStrobeFlash = 49,
    GreenStrobeFlash = 50,
    BlueStobeFlash = 51,
    YellowStrobeFlash = 52,
    CyanStrobeFlash = 53,
    PurpleStrobeFlash = 54,
    WhiteStrobeFlash = 55,
    SevenColorJumping = 56,
}
export declare type FluxBulbMode = "unknown" | "ww" | "color" | "preset" | "custom";
export declare class FluxBulbState {
    on: boolean;
    mode: FluxBulbMode;
    brightness: number;
    pattern?: string;
    color?: Color;
    constructor(status: Buffer);
    private determineMode(pattern, level);
    private isPresetPattern(pattern);
    toString(): string;
}
export declare type FluxBulbOptions = {
    timeout: number;
};
export declare class FluxBulb {
    private host;
    private port;
    opts: FluxBulbOptions;
    constructor(host: string, port?: number, options?: FluxBulbOptions);
    private connect();
    private sendCommand(cmd);
    getState(): Promise<FluxBulbState>;
    turn(on: boolean): void;
    turnOn(): void;
    turnOff(): void;
    setWarm(level: number): void;
    setColor(color: Color): void;
    setRGB(r: number, g: number, b: number): void;
    darken(percent: number): void;
    brighten(percent: number): void;
}
