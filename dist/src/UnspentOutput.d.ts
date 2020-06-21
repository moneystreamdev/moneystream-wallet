export declare class UnspentOutput {
    satoshis: number;
    script: string;
    txId: string;
    outputIndex: number | undefined;
    constructor(satoshis: number, script: string, txid?: string, txoutindex?: number);
    toTxOut(): any;
}
//# sourceMappingURL=UnspentOutput.d.ts.map