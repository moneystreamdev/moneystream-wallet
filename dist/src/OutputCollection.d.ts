/// <reference types="node" />
/// <reference types="long" />
import { UnspentOutput } from "./UnspentOutput";
export declare class OutputCollection {
    private _outs;
    constructor(outputs?: UnspentOutput[]);
    get items(): UnspentOutput[];
    hasAny(): boolean;
    add(output: UnspentOutput): number;
    add_conditional(output: UnspentOutput): number;
    get count(): number;
    get firstItem(): UnspentOutput;
    get lastItem(): UnspentOutput;
    spendable(): OutputCollection;
    encumbered(): OutputCollection;
    spent(): OutputCollection;
    get satoshis(): number;
    static fromJSON(json: any): OutputCollection;
    findTxOut(txout: UnspentOutput): UnspentOutput | null;
    find(txHashBuf: Buffer, txOutNum: number): UnspentOutput | null;
    filter(satoshis: Long): OutputCollection;
    split(targetCount: number, satoshis: number): {
        utxo: OutputCollection;
        breakdown: OutputCollection;
    };
}
//# sourceMappingURL=OutputCollection.d.ts.map