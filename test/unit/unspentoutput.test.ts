import { Bn, TxOut, Script } from 'bsv'
import { UnspentOutput } from "../../src"
import { TxPointer } from '../../src/TxPointer'

const someHashBufString = '1aebb7d0776cec663cbbdd87f200bf15406adb0ef91916d102bcd7f86c86934e'
const TEST_TXID='d538d5ac29f591104e6e84ad00c91fbcdeee7a94c1efb41f4ffe9b3dfe149765'

describe('unspentoutput tests', () => {
    it('should instantiate', () => {
        const utxo = new UnspentOutput(
            1111,
            Script.fromString('')
        )
        expect(utxo).toBeInstanceOf(UnspentOutput)
    })
    it('should create from txout', () => {
        const txout = TxOut.fromProperties(
            new Bn(1),
            Script.fromString('')
        )
        const unspent = UnspentOutput.fromTxOut(txout, someHashBufString,99)
        expect(unspent).toBeDefined()
        expect(unspent.satoshis).toBe(1)
        expect(unspent.outputIndex).toBe(99)
        expect(unspent.txId).toBe(someHashBufString)
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
            TEST_TXID,99
        )
        expect(utxo.txPointer).toBeInstanceOf(TxPointer)
        expect(utxo.txPointer.toString()).toBe(`${TEST_TXID}.99`)
    })
    it('should respond to session events', () => {
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
    it('it should set walletId', () => {
        const utxo = new UnspentOutput(
            1111,
            Script.fromString(''),
            TEST_TXID,99,undefined,"userwallet"
        )
        expect(utxo.walletId).toBe("userwallet")
    })
    it('spent should have zero balance', () => {
        const utxo = new UnspentOutput(
            1111,
            Script.fromString(''),
            TEST_TXID,99,undefined,"userwallet"
        )
        utxo.spend()
        expect(utxo.balance).toBe(0)
    })

})