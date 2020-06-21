import { Bn, TxOut } from 'bsv'

export class UnspentOutput {
    satoshis:number
    script:string
    txId:string = ""
    outputIndex:number|undefined = 0
    constructor(satoshis:number,script:string,txid?:string,txoutindex?:number) {
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