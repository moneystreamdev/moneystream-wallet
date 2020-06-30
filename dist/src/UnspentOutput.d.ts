import { Script } from 'bsv';
export declare class UnspentOutput {
    private _status;
    satoshis: number;
    script: typeof Script;
    txId: string;
    outputIndex: number | undefined;
    constructor(satoshis: number, script: typeof Script, txid?: string, txoutindex?: number);
    get status(): string;
    toTxOut(): any;
    encumber(): void;
    spend(): void;
}
//# sourceMappingURL=UnspentOutput.d.ts.map