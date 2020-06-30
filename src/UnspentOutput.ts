import { Bn, TxOut, Script } from 'bsv'

export class UnspentOutput {
    private _status:string = "available"
    satoshis:number
    script: typeof Script
    // txid is string but should be buf?
    txId:string = ""
    outputIndex:number|undefined = 0

    constructor(satoshis:number,script:typeof Script,txid?:string,txoutindex?:number) {
        this.script = script
        this.satoshis = satoshis
        this.txId = txid || ""
        this.outputIndex = txoutindex
    }

    get status() { return this._status}

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

    // mark this utxo when it is finally spent
    // at end of session
    spend() {
        this._status = "spent"
    }
}