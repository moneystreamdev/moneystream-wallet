/// <reference types="node" />
import { UnspentOutput } from "./UnspentOutput";
import * as Long from 'long';
export declare class OutputCollection {
    private _outs;
    walletId: string;
    constructor(outputs?: UnspentOutput[], walletId?: string);
    get items(): UnspentOutput[];
    hasAny(): boolean;
    add(output: UnspentOutput): number;
    add_conditional(output: UnspentOutput): number;
    addOutputs(outs: OutputCollection): void;
    get count(): number;
    get firstItem(): UnspentOutput;
    get lastItem(): UnspentOutput;
    spendable(): OutputCollection;
    encumbered(): OutputCollection;
    spent(): OutputCollection;
    get largestItem(): UnspentOutput;
    get smallestItem(): UnspentOutput;
    get satoshis(): number;
    get balance(): number;
    static fromJSON(json: any | null): OutputCollection;
    findTxOut(txout: UnspentOutput): UnspentOutput | null;
    find(txHashBuf: Buffer, txOutNum: number): UnspentOutput | null;
    filter(satoshis: Long): OutputCollection;
    split(targetCount: number, satoshis: number): {
        utxo: OutputCollection;
        breakdown: OutputCollection;
    };
}
//# sourceMappingURL=OutputCollection.d.ts.map