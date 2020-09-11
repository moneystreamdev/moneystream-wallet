import { TxOut, Script } from 'bsv';
import { TxPointer } from './TxPointer';
export declare class UnspentOutput {
    private _status;
    satoshis: number;
    script: typeof Script;
    txId: string;
    outputIndex: number | undefined;
    walletId: string;
    constructor(satoshis: number, script: typeof Script, txid?: string, txoutindex?: number, status?: string, walletId?: string);
    get status(): string;
    get txPointer(): TxPointer;
    static fromTxOut(txOut: typeof TxOut, txid: string, txoutindex: number): UnspentOutput;
    toTxOut(): any;
    encumber(): void;
    unencumber(): void;
    spend(): void;
}
//# sourceMappingURL=UnspentOutput.d.ts.map