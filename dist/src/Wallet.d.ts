/// <reference types="long" />
/// <reference types="node" />
import { IStorage } from './FileSystemStorage';
import { IIndexingService } from './IndexingService';
import { KeyPair } from './KeyPair';
import { TransactionBuilder } from './TransactionBuilder';
import { OutputCollection } from './OutputCollection';
import { UnspentOutput } from './UnspentOutput';
import { Tx, Script } from 'bsv';
export declare class Wallet {
    protected readonly FINAL: number;
    _isDebug: boolean;
    protected _walletFileName: string;
    protected _maxInputs: number;
    protected _allowFundingBelowRequested: boolean;
    protected _allowZeroFunding: boolean;
    protected _dustLimit: number;
    protected _allowMultipleInputs: boolean;
    protected _fundingInputCount?: number;
    protected _senderOutputCount?: number;
    _selectedUtxos: OutputCollection | null;
    _keypair: KeyPair;
    lastTx: any;
    protected SIGN_INPUT_CHANGE: number;
    protected SIGN_INPUT_NOCHANGE: number;
    protected _storage: IStorage;
    protected _index?: IIndexingService;
    constructor(storage: IStorage, index?: IIndexingService);
    get keyPair(): KeyPair;
    get selectedUtxos(): OutputCollection;
    set selectedUtxos(val: OutputCollection);
    get balance(): number;
    get fundingInputCount(): number | undefined;
    get senderOutputCount(): number | undefined;
    set allowZeroFunding(val: boolean);
    set allowFundingBelowRequested(val: boolean);
    get fileName(): string;
    set fileName(val: string);
    clear(): void;
    pad(pad: string, str: string | undefined, padLeft: boolean): string;
    txInDescription(txIn: any, index: number): {
        value: number | undefined;
        desc: string;
    };
    getInputOutput(txin: any, index: number): UnspentOutput | null | undefined;
    getTxFund(tx: typeof Tx): number;
    getTxSummary(tx: typeof Tx): any;
    logDetailsLastTx(): void;
    logDetails(tx?: any): void;
    toJSON(): {
        wif: string;
        xpub: string;
        address: any;
    };
    loadWalletFromJSON(fileName: string): void;
    loadWallet(wif?: string): void;
    generateKey(): any;
    store(wallet: any): Promise<any>;
    loadUnspent(): Promise<OutputCollection>;
    logUtxos(utxos: any): void;
    getAnUnspentOutput(force?: boolean): Promise<OutputCollection>;
    spendUtxos(utxos: OutputCollection, tx: typeof Tx, index: number): number;
    makeSimpleSpend(satoshis: Long, utxos?: OutputCollection, toAddress?: string): Promise<any>;
    tryLoadWalletUtxos(): Promise<void>;
    selectExpandableInputs(satoshis: Long, selected: OutputCollection, utxos?: OutputCollection): OutputCollection;
    addData(txb: TransactionBuilder, data: Buffer): void;
    makeStreamableCashTx(satoshis: Long, payTo?: typeof Script | Array<any> | null, makeFuture?: boolean, utxos?: OutputCollection, data?: Buffer): Promise<{
        hex: any;
        tx: any;
        utxos: OutputCollection;
        txOutMap: any;
    }>;
    handlePayTo(txb: TransactionBuilder, payTo: string | Array<any> | null | undefined, satoshis: Long): void;
    split(utxos: OutputCollection, targetCount: number, satoshis: number): Promise<{
        hex: any;
        tx: any;
        utxos: OutputCollection;
    } | undefined>;
    countOutputs(tx: typeof Tx): number;
    filteredOutputs(tx: typeof Tx): any[];
}
//# sourceMappingURL=Wallet.d.ts.map