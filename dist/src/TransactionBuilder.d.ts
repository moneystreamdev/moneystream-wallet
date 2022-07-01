import { Bn, TxBuilder, Script } from 'bsv';
import { KeyPair } from './KeyPair';
import { UnspentOutput } from './UnspentOutput';
export declare class TransactionBuilder {
    txb: typeof TxBuilder;
    futureSeconds: number;
    private FINAL;
    inputAmountBuilt: typeof Bn | null;
    outputAmountBuilt: typeof Bn | null;
    constructor();
    get tx(): any;
    get txid(): any;
    get miningFee(): number;
    inTheFuture(tx: any): any;
    setChangeAddress(address: any): void;
    importPartiallySignedTx(tx: any): void;
    from(utxos: UnspentOutput[], pubKey: any, sigHash?: number): TransactionBuilder;
    toAddress(satoshis: number, address: string): TransactionBuilder;
    change(address: any): TransactionBuilder;
    hasInput(utxo: UnspentOutput): boolean;
    addInput(utxo: UnspentOutput, pubKey: any, sigHash?: any): number;
    addOutputScript(satoshis: number, script: string | typeof Script): void;
    addOutputAddress(satoshis: number, address: any): void;
    buildAndSign(keypair: KeyPair, makeFuture?: boolean): any;
    sign(keyPair: any, makeFuture?: boolean): any;
}
//# sourceMappingURL=TransactionBuilder.d.ts.map