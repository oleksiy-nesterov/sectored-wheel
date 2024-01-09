declare class CustomElement extends HTMLElement {
    shadow: ShadowRoot | null;
    onConnect(): void;
    onDisconnect(): void;
    constructor();
    emit(eventName: string, eventData: unknown): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
}
export declare class SectoredWheelItemElement extends CustomElement {
    onConnect(): void;
    static get observedAttributes(): string[];
    attributeChangedCallback(): void;
}
declare global {
    interface Window {
        SectoredWheelItemElement: typeof SectoredWheelItemElement;
    }
}
export declare class SectoredWheelElement extends CustomElement {
    #private;
    rotate: (fromIndex: number, toIndex: number, noAnimate?: boolean, reset?: boolean) => void;
    spin: () => void;
    realign: (...args: unknown[]) => void;
    setIndexAsync: (promiseOrIndex: number | Promise<number> | (() => number), minSpinTime?: number) => Promise<void>;
    static get observedAttributes(): string[];
    attributeChangedCallback(attributeName: string, oldValue: string, newValue: string): void;
    set index(v: number | string);
    get index(): number;
    set size(v: string);
    get size(): string;
    set colors(v: string[] | string);
    get colors(): string[];
    set stroke(v: number | string);
    get stroke(): number;
    set strokeColor(v: string);
    get strokeColor(): string;
    set padding(v: number | string);
    get padding(): number;
    set azimuth(v: string);
    get azimuth(): string;
    set direction(v: string);
    get direction(): string;
    set rotationAcceleration(v: number | string);
    get rotationAcceleration(): number;
    set rotationTime(v: string);
    get rotationTime(): string;
    get inRotation(): boolean;
    get inSpinning(): boolean;
    onConnect(): void;
    onDisconnect(): void;
}
declare global {
    interface Window {
        SectoredWheelElement: typeof SectoredWheelElement;
    }
}
export {};
