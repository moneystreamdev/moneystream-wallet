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

    get count(): number { return this._outs.length }

    get firstItem(): UnspentOutput { return this._outs[0]}    
    get lastItem(): UnspentOutput { return this._outs[this.count-1]}    

    spendable(): OutputCollection {
        return new OutputCollection(this._outs.filter( o => o.status === 'available'))
    }
    encumbered(): OutputCollection {
        return new OutputCollection(this._outs.filter( o => o.status === 'hold'))
    }
    spent(): OutputCollection {
        return new OutputCollection(this._outs.filter( o => o.status === 'spent'))
    }

    get satoshis(): number {
        if (this._outs.length === 0) return 0
        let sum = 0
        //return this._outs.reduce( (a:any,b:any) => a + b.satoshis )
        for (let i:any=0; i<this._outs.length; i++ ) {
            sum += this._outs[i].satoshis
        }
        return sum
    }

    find(txHashBuf:any, txOutNum:number):UnspentOutput|null {
        for (let i=0; i<this._outs.length; i++ ) {
            const thisOut = this._outs[i]
            if (thisOut.outputIndex === txOutNum
                && thisOut.txId === txHashBuf.toString('hex')) {
                    return thisOut
            }
        }
        return null
    }

    filter(satoshis:Long) : OutputCollection {
        //sort by satoshis descending
        //TODO: put non-confirmed at bottom, else track encumbered
        this._outs.sort((a:any,b:any) => b.satoshis - a.satoshis)
        let amountremaining = satoshis.toNumber()
        //keep adding outputs until we can cover the amount
        const result = new OutputCollection()
        for (let i = 0; i<this._outs.length; i++) {
            const utxo = this._outs[i]
            if (amountremaining < 0) break
            amountremaining -= utxo.satoshis
            if (amountremaining === 0) {
                result.add(utxo)
                break
            }
            result.add(utxo)
        }
        return result
    }

    // return a OutputCollection for wallet to
    // operate upon
    split (targetCount:number, satoshis:number) {
        this._outs.sort((a:any,b:any) => b.satoshis - a.satoshis)
        const result = 
            {
                utxo: new OutputCollection(),
                breakdown: new OutputCollection()
            }
        //find largest one
        if (this.count > 0) {
            const largest:UnspentOutput = this._outs[0]
            let actualBreak = satoshis
            if (largest.satoshis > satoshis) {
                const desiredBreak = largest.satoshis / targetCount
                if (desiredBreak > satoshis) {
                    actualBreak = desiredBreak
                }
            }
            result.utxo.add(largest)
            let remaining = actualBreak * targetCount
            while (remaining > 0) {
                result.breakdown.add(
                    new UnspentOutput(actualBreak,largest.script)
                )
                remaining -= actualBreak
            }
            if (result.breakdown.count > 0) {
                result.breakdown.lastItem.satoshis += remaining
            }
        }
        return result
    }
}