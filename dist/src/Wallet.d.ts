/// <reference types="long" />
import { KeyPair } from './KeyPair';
export declare class Wallet {
    _isDebug: boolean;
    protected _walletFileName: string;
    protected _dustLimit: number;
    private _txOutMap;
    _utxo: any;
    _keypair: KeyPair;
    lastTx: any;
    protected SIGN_MY_INPUT: number;
    constructor();
    txInDescription(txIn: any, index: number): {
        value: any;
        desc: string;
    };
    getTxFund(tx: any): number;
    logDetailsLastTx(): void;
    logDetails(tx?: any): void;
    toJSON(): {
        wif: string;
        xpub: string;
        address: any;
    };
    loadWallet(wif?: string): any;
    generateKey(): any;
    store(wallet: any): any;
    backup(): void;
    logUtxos(utxos: any): void;
    getUtxoFrom(utxos: any, satoshis: Long): any[];
    getAnUnspentOutput(satoshis: Long): Promise<void>;
    makeSimpleSpend(satoshis: Long): Promise<string>;
    makeAnyoneCanSpendTx(satoshis: Long): Promise<any>;
    getApiTxJSON(txhash: string): Promise<any>;
    getUtxos(address: any): Promise<any>;
    broadcastRaw(txhex: string): Promise<any>;
}
//# sourceMappingURL=Wallet.d.ts.map