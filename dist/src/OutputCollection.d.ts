/// <reference types="long" />
import { UnspentOutput } from "./UnspentOutput";
export declare class OutputCollection {
    private _outs;
    constructor(outputs?: UnspentOutput[]);
    get items(): UnspentOutput[];
    hasAny(): boolean;
    add(output: any): void;
    count(): number;
    satoshis(): number;
    find(txHashBuf: any, txOutNum: number): UnspentOutput | null;
    filter(satoshis: Long): OutputCollection;
}
//# sourceMappingURL=OutputCollection.d.ts.map