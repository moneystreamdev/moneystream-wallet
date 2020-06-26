import { UnspentOutput } from "./UnspentOutput"

//a list of transaction outputs
export class OutputCollection {
    private _outs: UnspentOutput[] = []
    constructor(outputs?:UnspentOutput[]) {
        if (outputs) this._outs = outputs
    }
    get items() { return this._outs }

    hasAny() {
        return this._outs.length > 0
    }

    add(output:any) {
        this._outs.push(output)
    }

    count(): number { return this._outs.length }

    satoshis():number {
        if (this._outs.length === 0) return 0
        let sum = 0
        //return this._outs.reduce( (a:any,b:any) => a + b.satoshis )
        for (let i:any=0; i<this._outs.length; i++ ) {
            sum += this._outs[i].satoshis
        }
        return sum
    }

    find(txHashBuf:any, txOutNum:number):UnspentOutput|null {
        // console.log(txHashBuf.toString('hex'))
        // console.log(txOutNum)
        for (let i=0; i<this._outs.length; i++ ) {
            const thisOut = this._outs[i]
            // console.log(thisOut.outputIndex)
            // console.log(thisOut.txId)
            if (thisOut.outputIndex === txOutNum
                && thisOut.txId === txHashBuf.toString('hex')) {
                    return thisOut
            }
        }
        return null
    }

    filter(satoshis:Long) : OutputCollection {
        //sort by satoshis descending
        //TODO: put non-confirmed at bottom!
        this._outs.sort((a:any,b:any) => b.satoshis - a.satoshis)
        //console.log(this._outs)
        let amountremaining = satoshis.toNumber()
        //keep adding outputs until we can cover the amount
        const result = new OutputCollection()
        for (let i:number = 0; i<this._outs.length; i++) {
            const utxo = this._outs[i]
            result.add(utxo)
            amountremaining -= utxo.satoshis
            if (amountremaining < 0) break
        }
        return result

    }
}