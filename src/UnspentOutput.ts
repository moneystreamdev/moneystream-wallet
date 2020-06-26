import { Bn, TxOut, Script } from 'bsv'

export class UnspentOutput {
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

    toTxOut() {
        return TxOut.fromProperties(
            new Bn(this.satoshis),
            this.script
        )
    }
}