import { TxOut, Script } from 'bsv'
import { UnspentOutput } from "../../src"

describe('unspentoutput tests', () => {
    it('should instantiate', () => {
        const utxo = new UnspentOutput(
            1111,
            Script.fromString('')
        )
        expect(utxo).toBeInstanceOf(UnspentOutput)
    })
    it('it should output as TxOut', () => {
        const utxo = new UnspentOutput(
            1111,
            Script.fromString('')
        )
        expect(utxo.toTxOut()).toBeInstanceOf(TxOut)
    })

})