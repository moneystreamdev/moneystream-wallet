/// <reference types="long" />
import { UnspentOutput } from "./UnspentOutput";
export declare class OutputCollection {
    private _outs;
    constructor(outputs?: UnspentOutput[]);
    get items(): UnspentOutput[];
    hasAny(): boolean;
    add(output: any): void;
    count(): number;
    get lastItem(): UnspentOutput;
    satoshis(): number;
    find(txHashBuf: any, txOutNum: number): UnspentOutput | null;
    filter(satoshis: Long): OutputCollection;
    split(targetCount: number, satoshis: number): {
        utxo: UnspentOutput;
        breakdown: OutputCollection;
    };
}
//# sourceMappingURL=OutputCollection.d.ts.map