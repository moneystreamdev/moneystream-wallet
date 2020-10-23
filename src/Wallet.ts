'use strict'
import FileSystemStorage, { IStorage } from './FileSystemStorage'
import IndexingService, {IIndexingService} from './IndexingService'
import { Bn, Tx, Address, Sig, Script } from 'bsv'
import { KeyPair } from './KeyPair'
import { TransactionBuilder } from './TransactionBuilder'
import { OutputCollection } from './OutputCollection'
import { UnspentOutput } from './UnspentOutput'

// base class for streaming wallet
// A wallet generates transactions
// TODO: extract wallet storage into separate class
// TODO: extract debugging formatting into separate class
export class Wallet {
    protected readonly FINAL:number = 0xffffffff
    public _isDebug: boolean
    protected _walletFileName: string
    protected _maxInputs: number = 999
    // if true, allows wallet to be completely spent
    protected _allowFundingBelowRequested: boolean = true
    protected _allowZeroFunding: boolean = false
    protected _dustLimit: number
    //true if user can combine inputs to extend session
    protected _allowMultipleInputs: boolean = true
    protected _fundingInputCount?: number
    protected _senderOutputCount?: number
    //outputs that this wallet needs to deal with
    //could be outputs for our wallet
    //or others, if we import tx from others
    //txoutmap is collection to know the value of the TxIn
    //txbuilder has reference to txoutmap, use that instead?
    //private _txOutMap:any
    // a previously encumbered utxo
    _selectedUtxos: OutputCollection | null = null
    //wallet pub/priv key pair for signing tx
    _keypair!: KeyPair
    //the last transaction this wallet made
    lastTx: any
    // certifies "I am signing for my input and output, 
    // anyone else can add inputs and outputs"
    protected SIGN_INPUT_CHANGE = 
        Sig.SIGHASH_SINGLE 
        | Sig.SIGHASH_ANYONECANPAY
        | Sig.SIGHASH_FORKID
    protected SIGN_INPUT_NOCHANGE = 
        Sig.SIGHASH_NONE 
        | Sig.SIGHASH_ANYONECANPAY
        | Sig.SIGHASH_FORKID
    // storage for keys
    protected _storage: IStorage
    protected _index: IIndexingService

    constructor(storage?:IStorage, index?:IIndexingService) {
        this._isDebug = true
        this._walletFileName = 'wallet.json'
        this._dustLimit = 140
        this._storage = storage || new FileSystemStorage(this._walletFileName)
        this._index = index || new IndexingService()
    }

    get keyPair() { return this._keypair }
    get selectedUtxos() { 
        if (!this._selectedUtxos) this._selectedUtxos = new OutputCollection()
        return this._selectedUtxos 
    }
    set selectedUtxos(val) { this._selectedUtxos = val }

    get balance():number {
        if (!this._selectedUtxos) return 0
        return this.selectedUtxos?.spendable().satoshis || 0
    }
    get fundingInputCount() { return this._fundingInputCount }
    get senderOutputCount() { return this._senderOutputCount }
    set allowZeroFunding(val:boolean) { this._allowZeroFunding = val }
    set allowFundingBelowRequested(val:boolean) { this._allowZeroFunding = val }
    get fileName() { return this._walletFileName }
    set fileName(val:string) { 
        this._walletFileName = val 
        this._storage = new FileSystemStorage(this._walletFileName)
    }

    clear() {
        this._selectedUtxos = null
    }

    pad(pad:string, str:string|undefined, padLeft:boolean) {
        if (typeof str === 'undefined') return pad
        if (padLeft) {
            return (pad + str).slice(-pad.length)
        } else {
            return (str + pad).substring(0, pad.length)
        }
    }

    txInDescription(txIn:any, index:number) {
        const inputValue = this.getInputOutput(txIn, index)?.satoshis
        const inputSeq = txIn.nSequence || this.FINAL
        const inputPrevHash = txIn.txHashBuf.toString('hex')
        const inputPrevIndex = txIn.txOutNum
        const inputPrevHashCondensed = `${inputPrevHash.slice(0,4)}...${inputPrevHash.slice(-4)}:${inputPrevIndex}`
        const signingText = (txIn.constructor.name === 'Input' ? `CANNOT SIGN ABSTRACT! `:'')
        return {value:inputValue, desc:`${txIn.constructor.name}[${index}]${this.pad('        ',inputValue?.toString(),true)}:${inputSeq === this.FINAL?'Final':inputSeq.toString()} spends ${inputPrevHashCondensed} ${signingText}`}
    }

    //get the txout that the txin is spending
    getInputOutput(txin:any, index:number):UnspentOutput|null|undefined {
        //txout being spent will probably be in _selectedUtxos
        return this._selectedUtxos?.find(txin.txHashBuf, txin.txOutNum)
    }

    getTxFund(tx:typeof Tx):number {
        let fundingTotal = 0
        if (tx.txIns.length > 0) {
            const len = this.fundingInputCount === null || this.fundingInputCount === undefined 
                ? tx.txIns.length : this.fundingInputCount
            for (let index = 0; index < len; index++) {
                const txin = tx.txIns[index]
                const txInputOut = this.getInputOutput(txin, index)
                fundingTotal += (txInputOut ? txInputOut.satoshis:0)
            }
            // only subtract the output if it comes from the sender
            if (this._senderOutputCount === undefined || this._senderOutputCount > 0) {
                const txout = tx.txOuts[0]
                fundingTotal -= (txout?txout.valueBn.toNumber():0)
            }
        }
        return fundingTotal
    }

    getTxSummary(tx:typeof Tx): any {
        let totins = 0
        for (let index = 0; index < tx.txIns.length; index++) {
            const txin = tx.txIns[index]
            const txInputOut = this.getInputOutput(txin, index)
            totins += (txInputOut ? txInputOut.satoshis:0)
        }
        return {
            input: totins,
            output: tx.txOuts.reduce((x:number, curr:any) => x + curr.valueBn.toNumber(), 0)
        }
    }

    logDetailsLastTx() {
        this.logDetails(this.lastTx)
    }
    logDetails(tx?: any) {
        let details = ""
        details += `\n${this._keypair.toAddress().toString()}`
        if (tx) {
            //TODO: translate locktime to date time
            details += `\nLocked until ${tx.nLockTime}`
            if (tx.txIns && tx.txIns.length > 0) {
                details += `\nInputs ${tx.txIns.length}`
            }
            let inputTotal = 0
            for (let i = 0; i < tx.txIns.length; i++) {
                const txIn = tx.txIns[i]
                const {value,desc} = this.txInDescription(txIn, i)
                details += `\n   ${desc}`
                inputTotal += value ? value : 0
            }
            if (inputTotal) details += `\nTotal In:${inputTotal}`
            let platformTotal = 0
            let outputTotal = 0
            for (let i = 0; i < tx.txOuts.length; i++) {
                const txout = tx.txOuts[i]
                const satoshis = txout.valueBn.toNumber()
                details += `\n   TxOut[${i}]${this.pad('        ',satoshis.toString(),true)}`
                if (txout.script?.isSafeDataOut()) {
                    details += ` ${txout.script.getData()}`
                }
                if (txout.script?.isPubKeyHashOut()) {
                    details += ` P2PKH`
                }
                outputTotal += satoshis
                if (i > 2) platformTotal += satoshis
            }
            let lineTotal = "\n"
            if (outputTotal) lineTotal += `Total Out:${outputTotal}`
            const fund = this.getTxFund(tx)
            lineTotal += `\tFunding:${fund}`
            platformTotal = fund
            lineTotal += `\tPlatform:${platformTotal}`
            const minerFee = inputTotal - outputTotal - platformTotal
            lineTotal += `\tMiner Fee:${minerFee}`
            //TODO: add back to bsv2
            //details += `\nFullySigned?${tx.isFullySigned()}`
            details += lineTotal
        }
        console.log(details)
    }

    toJSON() {
        const walletjson = {
            "wif": this._keypair.toWif(),
            "xpub": this._keypair.toXpub(),
            "address": this._keypair.toAddress().toString()
        }
        return walletjson
    }

    loadWalletFromJSON(fileName: string) {
        this._walletFileName = fileName
        this._storage = new FileSystemStorage(this._walletFileName)
        const content = this._storage.tryget()
        const jcontent = JSON.parse(content||'{}')
        this.loadWallet(jcontent?.wif)
    }

    loadWallet(wif?:string) {
        if (wif) {
            this._keypair = new KeyPair().fromWif(wif)
        } else {
            // try to load wallet from storage?
        }
        if (!this._keypair) {
            this.generateKey()
        }
    }

    generateKey() {
        this._keypair = new KeyPair().fromRandom()
        return this._keypair.pubKey.toString()
    }

    async store(wallet:any) {
        const sWallet = JSON.stringify(wallet, null, 2)
        this._storage.put(sWallet)
        return wallet
    }

    async loadUnspent(): Promise<OutputCollection> {
        return this.getAnUnspentOutput(true)
    }

    // use OutputCollection.items
    logUtxos(utxos:any) {
        let logit = `In ${this.constructor.name} ${utxos.length} Unspent outputs`
        let tot = 0
        for (let i:number = 0; i<utxos.length; i++) {
            const utxo = utxos[i]
            logit += `\n${utxo.satoshis}x${utxo.txId.slice(0,4)}...${utxo.txId.slice(-4)}:${utxo.outputIndex}`
            tot += utxo.satoshis
        }
        logit += `\nTotal:${tot}`
        console.log(logit)
    }

    //todo cache utxos
    async getAnUnspentOutput(force?: boolean): Promise<OutputCollection> {
        if ( force || !this._selectedUtxos?.hasAny()) {
            const utxos = await this._index.getUtxosAPI(this._keypair.toAddress())
            if (utxos && utxos.length > 0) {
                for(let i=0; i<utxos.length; i++)
                {
                    const utxo0 = utxos[i]
                    const newutxo = new UnspentOutput(
                        utxo0.value, 
                        this._keypair.toOutputScript(),
                        Buffer.from(utxo0.tx_hash,'hex').reverse().toString('hex'),
                        utxo0.tx_pos,
                        undefined,
                        this._keypair.toAddress().toString()
                        )
                    const addcount = this.selectedUtxos.add_conditional(newutxo)
                }
            }
        }
        return this.selectedUtxos
    }

    // legacy p2pkh spend
    async makeSimpleSpend(satoshis: Long, utxos?:OutputCollection, toAddress?:string): Promise<any> {
        if (!this._keypair) { throw new Error('Load wallet before spending') }
        const filteredUtxos = utxos || await this.getAnUnspentOutput()
        if (!filteredUtxos || filteredUtxos.count < 1) {
            throw Error(`Insufficient wallet funds. Send funds to ${this.keyPair.toAddress().toString()}`)
        }
        const utxoSatoshis: number = filteredUtxos.spendable().satoshis
        const changeSatoshis = utxoSatoshis - satoshis.toNumber()
        if (changeSatoshis < 0) {
            throw Error(`the utxo ran out of money ${changeSatoshis}`)
        }
        // TODO: estimate fee
        const fee = 300
        let txb = new TransactionBuilder()
            .from(filteredUtxos.items, this._keypair.pubKey)
            .toAddress(satoshis.toNumber(), toAddress ? Address.fromString(toAddress) : this._keypair.toAddress())
        if (changeSatoshis-fee>0) {
            txb = txb.toAddress(changeSatoshis-fee, this._keypair.toAddress())
        }
        // change not working
        // .change(this._keypair.toAddress())
        this.lastTx = txb.buildAndSign(this._keypair)
        return {
            hex: this.lastTx.toHex(),
            tx: this.lastTx,
            utxos: filteredUtxos,
            txOutMap: txb.txb.uTxOutMap
        }
        // tx can be broadcast and put on chain
    }

    //tries to load utxos for wallet and
    //throws error if it cannot get any
    async tryLoadWalletUtxos() {
        if (!this.selectedUtxos.hasAny()) await this.getAnUnspentOutput()
        if (!this.selectedUtxos.hasAny() && !this._allowZeroFunding) {
            throw Error(`Wallet ${this._keypair?.toAddress().toString()} does not have any unspent outputs!`)
        }
    }

    selectExpandableInputs (satoshis:Long, selected:OutputCollection, utxos?: OutputCollection ):OutputCollection {
        const filtered = utxos || selected.spendable().filter(satoshis)
        // console.log(`${filtered.satoshis} < ${satoshis.toNumber() + this._dustLimit}`)
        if (filtered.count < this._maxInputs && filtered.satoshis < (satoshis.toNumber() + this._dustLimit)) {
            // add additional utxos
            const additional = this.selectedUtxos.spendable().filter(satoshis.add(this._dustLimit))
            // TODO: make sure filtered includes previous utxos
            filtered.addOutputs(additional)
        }
        return filtered
    }


    // store data into transaction
    addData(txb: TransactionBuilder, data: Buffer) {
        const script = Script.fromSafeData(data)
        txb.txb.outputToScript(new Bn().fromNumber(0), script)
    }

    // standard method for a streaming wallet
    // payTo should be script, as instance of Script or string
    async makeStreamableCashTx(
        satoshis:Long, 
        payTo?:typeof Script|Array<any>|null, 
        makeFuture:boolean = true,
        utxos?:OutputCollection,
        data?: Buffer
    ) {
        if (!utxos) await this.tryLoadWalletUtxos()
        const filteredUtxos = this.selectExpandableInputs(satoshis, this.selectedUtxos, utxos)
        this._fundingInputCount = filteredUtxos.count
        // total value of selected unspents
        const utxoSatoshis = filteredUtxos.satoshis
        let changeSatoshis = utxoSatoshis - satoshis.toNumber()
        if (changeSatoshis < 0) {
            if (this._allowFundingBelowRequested
                && (!this._allowZeroFunding && utxoSatoshis > 0)) {
                if (Math.abs(changeSatoshis) <= this._dustLimit) {
                    // the deficit was less than dust
                    // wallet is about to run out of money
                    // exhaust remaining funds
                    changeSatoshis = 0
                }
            } else {
                throw Error(`the wallet ran out of money ${this.fundingInputCount} ${utxoSatoshis} ${changeSatoshis}`)
            }
        }
        // console.log(utxoSatoshis)
        // console.log(changeSatoshis)
        const txb = new TransactionBuilder()
        txb.setChangeAddress(this._keypair.toAddress())
        //TODO: for now, inputs have to be more than dust limit!
        const dustTotal = filteredUtxos.count * this._dustLimit
        //add range of utxos, change in first, others are dust
        //TODO: could spread them out?
        for (let index = 0; index < this._fundingInputCount; index++) {
            const element = filteredUtxos.items[index]
            let outSatoshis = 0 //this._dustLimit
            if (index === 0) {
                outSatoshis = Math.max(changeSatoshis,0)
            }
            const inputCount = txb.addInput(element, this._keypair.pubKey, 
                index === 0 && outSatoshis>0 ? this.SIGN_INPUT_CHANGE : this.SIGN_INPUT_NOCHANGE
            )
            if (inputCount !== index + 1) throw Error(`Input did not get added!`)
            //TODO: need many more unit tests
            if (outSatoshis > 0) {
                txb.addOutputAddress(
                    outSatoshis, 
                    this._keypair.toAddress()
                )
            }
        }
        //balance goes to payto (string|Script)
        this.handlePayTo(txb,payTo, satoshis)
        if (data) {
            this.addData(txb, data)
        }
        this.lastTx = txb.buildAndSign(this._keypair, makeFuture)
        this._senderOutputCount = this.lastTx.txOuts.length
        return {
            hex: this.lastTx.toHex(),
            tx: this.lastTx,
            utxos: filteredUtxos,
            txOutMap: txb.txb.uTxOutMap
        }
        // at this point, tx is spendable by anyone!
        // only pass it through secure channel to recipient
    }

    handlePayTo(
        txb: TransactionBuilder, 
        payTo: string|Array<any>|null|undefined, 
        satoshis: Long
    ) {
        if (payTo) {
            if (Array.isArray(payTo)) {
                let tot = 0
                for (let index = 0; index < payTo.length; index++) {
                    const pay = payTo[index]
                    // pay can be one or object to/percent
                    let calculatedAmount = Math.floor(satoshis.toNumber() * pay.percent/100)
                    tot += calculatedAmount
                    if (index === payTo.length - 1) {
                        // this gives extra amount to last one listed!
                        calculatedAmount += (satoshis.toNumber() - tot)
                    }
                    txb.addOutputScript(calculatedAmount, pay.to)
                }
            } else {
                // just one, pay all to them
                txb.addOutputScript(
                    satoshis.toNumber(), payTo
                )
            }
        }
    }

    // attempt to split utxos, trying to create
    // the targeted number of outputs with at least
    // the minimum number of satoshis in each one
    // on a best effort basis
    // caller must select utxos
    async split(
        utxos:OutputCollection,
        targetCount:number, 
        satoshis:number
    ) {
        const minSatoshis = Math.max(satoshis,this._dustLimit)
        //get utxos not emcumbered
        //await this.tryLoadWalletUtxos()
        //from all possible utxos, 
        //const splits = this.selectedUtxos.spendable().split(targetCount, minSatoshis)
        const splits = utxos.split(targetCount, minSatoshis)
        //only ones greater than min or dust
        if (splits.utxo.satoshis > 0) {
            //mining fee is maken out of each utxo instead of at end
            //splits.breakdown.lastItem.satoshis -= this._dustLimit
            const txb = new TransactionBuilder()
            txb.addInput(splits.utxo.firstItem, this._keypair.pubKey)
            for (let index = 0; index < splits.breakdown.items.length; index++) {
                const split = splits.breakdown.items[index]
                txb.addOutputAddress(split.satoshis, this._keypair.toAddress())
            }
            console.log(splits.breakdown)
            this.lastTx = txb.buildAndSign(this._keypair)
            return {
                hex: this.lastTx.toHex(),
                tx: this.lastTx,
                utxos: splits.utxo
            }
        }
    }

    //TODO: following utility type funcs can go elsewhere
    countOutputs(tx: typeof Tx) {
        let cnt = 0
        for (let index = 0; index < tx.txOuts.length; index++) {
            const txout = tx.txOuts[index]
            if (!txout.script?.isSafeDataOut()) {
                cnt++
            }
        }
        return cnt
    }

    filteredOutputs(tx: typeof Tx) {
        let result = []
        for (let index = 0; index < tx.txOuts.length; index++) {
            const txout = tx.txOuts[index]
            if (!txout.script?.isSafeDataOut()) {
                result.push(txout)
            }
        }
        return result
    }

}
