/// <reference types="long" />
export declare class OutputCollection {
    private _outs;
    constructor(outputs?: any);
    get items(): any;
    hasAny(): boolean;
    add(output: any): void;
    count(): number;
    satoshis(): number;
    filter(satoshis: Long): OutputCollection;
}
//# sourceMappingURL=OutputCollection.d.ts.map