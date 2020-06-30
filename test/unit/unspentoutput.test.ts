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
    it('it should respond to session events', () => {
        const utxo = new UnspentOutput(
            1111,
            Script.fromString('')
        )
        expect(utxo.status).toBe('available')
        utxo.encumber()
        expect(utxo.status).toBe('hold')
        utxo.spend()
        expect(utxo.status).toBe('spent')
    })

})