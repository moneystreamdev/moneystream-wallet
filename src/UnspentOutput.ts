import { Bn, TxOut, Script } from 'bsv'
import { TxPointer } from './TxPointer'

export class UnspentOutput {
    private _status:string = "available"
    satoshis:number
    script: typeof Script
    // txid is string but should be buf?
    txId:string = ""
    outputIndex:number|undefined = 0

    constructor(satoshis:number,script:typeof Script,
        txid?:string,txoutindex?:number,
        status?:string) {
        this.script = script
        this.satoshis = satoshis
        this.txId = txid || ""
        this.outputIndex = txoutindex
        this._status = status || 'available'
    }

    get status() { return this._status}
    get txPointer() { return new TxPointer(this.txId, this.outputIndex as number) }

    static fromTxOut(txOut:any, txid:string, txoutindex:number ) {
        const output = new UnspentOutput(
            txOut.valueBn.toNumber(),
            txOut.script
        )
        output.txId = txid
        output.outputIndex = txoutindex
        return output
    }

    toTxOut() {
        return TxOut.fromProperties(
            new Bn(this.satoshis),
            this.script
        )
    }

    // encumber this utxo in a session
    // utxo can only be encumbered in one session
    // at a time
    encumber() {
        this._status = "hold"
    }

    unencumber() {
        this._status = "available"
    }

    // mark this utxo when it is finally spent
    // at end of session
    spend() {
        this._status = "spent"
    }
}