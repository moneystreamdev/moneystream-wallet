'use strict'
import fs from 'fs'
import { Transaction, crypto } from 'bsv'
import fetch from 'node-fetch'
import { KeyPair } from './KeyPair'
import { TransactionBuilder } from './TransactionBuilder'

// base calss for streaming wallet
// A wallet generates transactions
// TODO: extract wallet storage into separate class
// TODO: extract external API calls into separate class
// TODO: extract debugging formatting into separate class
export class Wallet {
    public _isDebug: boolean
    protected _walletFileName: string
    protected _dustLimit: number
    //outputs that this wallet needs to deal with
    //could be outputs for our wallet
    //or others, if we import tx from others
    //txoutmap is collection to know the value of the TxIn
    private _txOutMap:any
    // a previously encumbered utxo
    //TODO: protected
    _utxo : any
    //protected _utxo_tx_hash: any
    //wallet pub/priv key pair for signing tx
    _keypair!: KeyPair
    //the last transaction this wallet made
    lastTx:any
    // certifies "I am signing for my input and output, 
    // anyone else can add inputs and outputs"
    protected SIGN_MY_INPUT = 
        crypto.Signature.SIGHASH_SINGLE 
        | crypto.Signature.SIGHASH_ANYONECANPAY
        | crypto.Signature.SIGHASH_FORKID

    constructor() {
        this._isDebug = true
        this._walletFileName = 'wallet.json'
        this._dustLimit = 500
    }

    txInDescription(txIn:any, index:number) {
        const inputValue = txIn.output.satoshis
        const inputSeq = txIn.sequenceNumber || 0xffffff
        const inputPrevHash = txIn.prevTxId.toString('hex')
        const inputPrevIndex = txIn.outputIndex
        const inputPrevHashCondensed = `${inputPrevHash.slice(0,4)}...${inputPrevHash.slice(-4)}:${inputPrevIndex}`
        const signingText = (txIn.constructor.name === 'Input' ? `CANNOT SIGN ABSTRACT! `:'')
            + txIn.constructor.name
        return {value:inputValue, desc:`[${index}]${inputValue}:${inputSeq === 0xffffffff?'Final':inputSeq.toString()} spends ${inputPrevHashCondensed} Type:${signingText}`}
    }
    getTxFund(tx:any):number {
        if (tx.inputs.length > 0 && tx.outputs.length > 0) {
            const txIn = tx.inputs[0]
            const txout = tx.outputs[0]
            const txInputOut = txIn.output
            const fund = (txInputOut ? txInputOut.satoshis:0) - txout.satoshis
            return fund
        }
        return 0
    }
    logDetails(tx?: any) {
        let details = ""
        details += `\n${this._keypair.toWif()}`
        details += `\n${this._keypair.toXpub()}`
        details += `\n${this._keypair.toAddress().toString()}`
        if (tx) {
            details += `\nLocked until ${tx.getLockTime()}`
            if (tx.inputs && tx.inputs.length > 0) {
                details += `\nInputs ${tx.inputs.length}`
            }
            let inputTotal = 0
            for (let i = 0; i < tx.inputs.length; i++) {
                const txIn = tx.inputs[i]
                const {value,desc} = this.txInDescription(txIn, i)
                details += `\n   ${desc}`
                inputTotal += value
            }
            if (inputTotal) details += `\nTotal In:${inputTotal}`
            if (tx.txOuts && tx.txOuts.length > 0) {
                details += `\nOutputs ${tx.txOuts.length}`
            }
            let platformTotal = 0
            let outputTotal = 0
            for (let i = 0; i < tx.outputs.length; i++) {
                const txout = tx.outputs[i]
                details += `\n   [${i}]${txout.satoshis}`
                outputTotal += txout.satoshis
                if (i > 2) platformTotal += txout.satoshis
            }
            if (outputTotal) details += `\nTotal Out:${outputTotal}`
            const fund = this.getTxFund(tx)
            details += `\nFunding:${fund}`
            platformTotal = fund - this._dustLimit
            details += `\nPlatform:${platformTotal}`
            const fees = inputTotal - outputTotal
            details += `\nFees:${fees}`
            details += `\nFullySigned?${tx.isFullySigned()}`
        }
        if (details) console.log(details)
    }

    toJSON() {
        const walletjson = {
            "wif": this._keypair.toWif(),
            "xpub": this._keypair.toXpub(),
            "address": this._keypair.toAddress().toString()
        }
        return walletjson
    }

    loadWallet(wif?:string) {
        if (wif) {
            this._keypair = new KeyPair().fromWif(wif)
        }
        if (!this._keypair) {
            this.generateKey()
            return this.store(this.toJSON())
        }
    }

    generateKey() {
        //generate keys, store and return xpub
        this._keypair = new KeyPair().fromRandom()
        return this._keypair.pubKey.toString()
    }

    store(wallet:any) {
        const sWallet = JSON.stringify(wallet, null, 2)
        //make a backup so we dont lose keys
        this.backup()
        try {
            fs.writeFileSync(this._walletFileName, sWallet, 'utf8')
        }
        catch (err) {
            if(err) {
                console.log(err)
                return
            }
        }
        return wallet
    }

    backup() {
        if (fs.existsSync(this._walletFileName)) {
            let timestamp = (new Date()).toISOString()
            .replace(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).(\d{3})Z$/, '$1$2$3.$4$5$6.$7000000');
            fs.renameSync(this._walletFileName, `${this._walletFileName}.${timestamp}`)
        }
    }

    logUtxos(utxos:any) {
        let logit = `In ${this.constructor.name} ${utxos.length} Unspent outputs`
        let tot = 0
        for (let i:number = 0; i<utxos.length; i++) {
            const utxo = utxos[i]
            logit += `\n${utxo.value}x${utxo.tx_hash.slice(0,4)}...${utxo.tx_hash.slice(-4)}:${utxo.tx_pos}`
            tot += utxo.value
        }
        logit += `\nTotal:${tot}`
        console.log(logit)
    }

    //get utxos to cover number of satoshis
    //return array of utxos
    getUtxoFrom(utxos:any, satoshis:Long):any[] {
        const result:any[] = []
        if (utxos.length < 1 ) return result
        if (utxos.length < 2) return [utxos[0]]
        //TODO: sort the utxos by some criteria? value?
        this.logUtxos(utxos)
        let amountremaining = satoshis.toNumber()
        //keep adding outputs until we can cover the amount
        for (let i:number = 0; i<utxos.length; i++) {
            const utxo = utxos[i]
            result.push(utxo)
            amountremaining -= utxo.value
            if (amountremaining < 0) break
        }
        return result
    }

    //todo cache utxos
    async getAnUnspentOutput(satoshis: Long) {
        if (!this._utxo) {
            const utxos = await this.getUtxos(this._keypair.toAddress())
            //console.log(utxos)
            if (utxos.length > 0) {
                const utxo0 = this.getUtxoFrom(utxos, satoshis)[0]
                //from woc. height 0 means unconfirmed
                //"height": 578325,
                // "tx_pos": 0,
                // "tx_hash": "62824e3af3d01113e9bce8b73576b833990d231357bd718385958c21d50bbddd",
                // "value": 1250020815
                // would be nice to get output script!
                //expecting valueBn, scriptVi, script
                this._utxo = new Transaction.UnspentOutput(
                    {
                        txid: utxo0.tx_hash,
                        vout: utxo0.tx_pos,
                        scriptPubKey: this._keypair.toScript(),
                        amount: utxo0.value,
                        satoshis: utxo0.value
                    }
                )
                //this._utxo_tx_hash = utxo0.tx_hash
                //this._utxo.amount = utxo0.value
            }
        }
    }

    // legacy p2pkh spend
    async makeSimpleSpend(satoshis: Long): Promise<string> {
        await this.getAnUnspentOutput(satoshis)
        if (!this._utxo) {
            throw Error('your wallet is empty')
        }
        const utxoSatoshis: number = this._utxo.satoshis
        const changeSatoshis = utxoSatoshis - satoshis.toNumber()
        if (changeSatoshis < 0) {
            throw Error(`the utxo ran out of money ${changeSatoshis}`)
        }

        const tx = new Transaction()
            .from(this._utxo)
            .to(this._keypair.toAddress(), changeSatoshis)
            .change(this._keypair.toAddress())
        tx.sign(this._keypair.privKey)

        if (this._isDebug) this.logDetails(tx)
        this.lastTx = tx
        return tx.toString('hex')
        // tx can be broadcast and put on chain
    }

    async makeAnyoneCanSpendTx(satoshis:Long) {
        if (!this._utxo) await this.getAnUnspentOutput(satoshis)
        if (!this._utxo) {
            throw Error('your wallet is empty')
        }
        const utxoSatoshis = this._utxo.satoshis
        const changeSatoshis = utxoSatoshis - satoshis.toNumber()
        if (changeSatoshis < 0) {
            throw Error(`the utxo ran out of money ${changeSatoshis}`)
        }
        const txb = new TransactionBuilder()
        txb.setChangeAddress(this._keypair.toAddress())
        txb.addInput(
            this._utxo, 
            this.SIGN_MY_INPUT
        )
        txb.addOutput(
            changeSatoshis, 
            this._keypair.toAddress()
            )
        txb.build()
        const tx = txb.sign(
            this._keypair.privKey, 
            this.SIGN_MY_INPUT
        )
        //if (this._isDebug) console.log(tx.toJSON())
        this.lastTx = tx
        return tx.toString()
        // at this point, tx is spendable by anyone!
        // only pass it through secure channel to recipient
        // tx needs further processing before broadcast
    }

    async getApiTxJSON(txhash:string) {
        const url = `https://api.whatsonchain.com/v1/bsv/main/tx/hash/${txhash}`
        const response = await fetch(url)
        return response.json()
    }

    //address object
    async getUtxos(address:any) {
        const url = `https://api.whatsonchain.com/v1/bsv/main/address/${address.toString()}/unspent`
        const response = await fetch(url)
        return response.json()
    }

    async broadcastRaw(txhex: string) {
        const url = 'https://api.whatsonchain.com/v1/bsv/main/tx/raw'
        const data = {
            "txhex": txhex
        }
        const body = JSON.stringify(data);
        const broadcast = await fetch(url, 
            {
                method: "POST", 
                headers: { 'Content-Type': 'application/json' },
                body:body
            }
        )
        return broadcast.json()
    }

}
