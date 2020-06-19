/// <reference types="long" />
import { KeyPair } from './KeyPair';
import { OutputCollection } from './OutputCollection';
export declare class Wallet {
    _isDebug: boolean;
    protected _walletFileName: string;
    protected _dustLimit: number;
    protected _allowMultipleInputs: boolean;
    private _txOutMap;
    _selectedUtxos: OutputCollection;
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
        address: string;
    };
    loadWallet(wif?: string): any;
    generateKey(): any;
    store(wallet: any): any;
    backup(): void;
    logUtxos(utxos: any): void;
    getUtxoFrom(utxos: any, satoshis: Long): any[];
    getAnUnspentOutput(satoshis: Long): Promise<any>;
    makeSimpleSpend(satoshis: Long): Promise<string>;
    makeAnyoneCanSpendTx(satoshis: Long): Promise<any>;
    getApiTxJSON(txhash: string): Promise<any>;
    getUtxosAPI(address: any): Promise<any>;
    broadcastRaw(txhex: string): Promise<any>;
}
//# sourceMappingURL=Wallet.d.ts.map