export class TxPointer {
    private txhash:string
    private index:number
    constructor(txhash:string, index:number) {
        this.txhash = txhash
        this.index = index
    }
    toString():string {
        return `${this.txhash}.${this.index}`
    }
}