import { KeyPair } from './KeyPair';
import { UnspentOutput } from './UnspentOutput';
export declare class TransactionBuilder {
    txb: any;
    futureSeconds: number;
    private FINAL;
    constructor();
    get tx(): any;
    inTheFuture(tx: any): any;
    setChangeAddress(address: any): void;
    importPartiallySignedTx(tx: any): void;
    from(utxos: any[], pubKey: any, sigHash?: number): TransactionBuilder;
    toAddress(satoshis: number, address: string): TransactionBuilder;
    change(address: any): TransactionBuilder;
    addInput(utxo: UnspentOutput, pubKey: any, sigHash?: any): void;
    addOutput(satoshis: number, address: any): void;
    buildAndSign(keypair: KeyPair, makeFuture?: boolean): any;
    sign(keyPair: any, makeFuture?: boolean): any;
}
//# sourceMappingURL=TransactionBuilder.d.ts.map