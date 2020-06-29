/// <reference types="long" />
import { IStorage } from './FileSystemStorage';
import { IIndexingService } from './IndexingService';
import { KeyPair } from './KeyPair';
import { OutputCollection } from './OutputCollection';
export declare class Wallet {
    protected readonly FINAL: number;
    _isDebug: boolean;
    protected _walletFileName: string;
    protected _dustLimit: number;
    protected _allowMultipleInputs: boolean;
    protected _fundingInputCount?: number;
    _selectedUtxos: OutputCollection;
    _keypair: KeyPair;
    lastTx: any;
    protected SIGN_MY_INPUT: number;
    protected _storage: IStorage;
    protected _index: IIndexingService;
    constructor(storage?: IStorage, index?: IIndexingService);
    get keyPair(): KeyPair;
    get selectedUtxos(): OutputCollection;
    set selectedUtxos(val: OutputCollection);
    get balance(): number;
    txInDescription(txIn: any, index: number): {
        value: any;
        desc: string;
    };
    getInputOutput(txin: any): any;
    getTxFund(tx: any): number;
    logDetailsLastTx(): void;
    logDetails(tx?: any): void;
    toJSON(): {
        wif: string;
        xpub: string;
        address: any;
    };
    loadWallet(wif?: string): void;
    generateKey(): any;
    store(wallet: any): any;
    loadUnspent(): Promise<void>;
    logUtxos(utxos: any): void;
    getAnUnspentOutput(force?: boolean): Promise<any>;
    makeSimpleSpend(satoshis: Long): Promise<string>;
    tryLoadWalletUtxos(): Promise<void>;
    makeAnyoneCanSpendTx(satoshis: Long, payTo?: string, makeFuture?: boolean): Promise<any>;
    split(targetCount: number, satoshis: number): Promise<any>;
}
//# sourceMappingURL=Wallet.d.ts.map