import { Script } from 'bsv';
export declare class UnspentOutput {
    satoshis: number;
    script: typeof Script;
    txId: string;
    outputIndex: number | undefined;
    constructor(satoshis: number, script: typeof Script, txid?: string, txoutindex?: number);
    toTxOut(): any;
}
//# sourceMappingURL=UnspentOutput.d.ts.map