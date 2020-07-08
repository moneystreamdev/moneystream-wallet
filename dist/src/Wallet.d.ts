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
    _selectedUtxos: OutputCollection | null;
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
    clear(): void;
    txInDescription(txIn: any, index: number): {
        value: any;
        desc: string;
    };
    getInputOutput(txin: any, index: number): any;
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
    store(wallet: any): Promise<void>;
    loadUnspent(): Promise<OutputCollection>;
    logUtxos(utxos: any): void;
    getAnUnspentOutput(force?: boolean): Promise<OutputCollection>;
    makeSimpleSpend(satoshis: Long, utxos?: OutputCollection): Promise<any>;
    tryLoadWalletUtxos(): Promise<void>;
    makeStreamableCashTx(satoshis: Long, payTo?: string | any, makeFuture?: boolean, utxos?: OutputCollection): Promise<{
        hex: any;
        tx: any;
        utxos: OutputCollection;
    }>;
    split(targetCount: number, satoshis: number): Promise<{
        hex: any;
        tx: any;
        utxos: OutputCollection;
    } | undefined>;
}
//# sourceMappingURL=Wallet.d.ts.map