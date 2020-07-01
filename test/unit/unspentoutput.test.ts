import { TxOut, Script } from 'bsv'
import { UnspentOutput } from "../../src"
import { TxPointer } from '../../src/TxPointer'

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
    it('it should output as TxPointer', () => {
        const utxo = new UnspentOutput(
            1111,
            Script.fromString(''),
            '123',99
        )
        expect(utxo.txPointer).toBeInstanceOf(TxPointer)
        expect(utxo.txPointer.toString()).toBe(`123.99`)
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