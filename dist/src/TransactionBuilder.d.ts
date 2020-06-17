export declare class TransactionBuilder {
    tx: any;
    futureSeconds: number;
    constructor();
    inTheFuture(tx: any): any;
    setChangeAddress(address: any): void;
    importPartiallySignedTx(tx: any): void;
    addInput(utxo: any, sigHash: any): void;
    addOutput(amount: number, address: any): void;
    build(): void;
    sign(keyPair: any, sigtype: any): any;
}
//# sourceMappingURL=TransactionBuilder.d.ts.map