import { TransactionBuilder } from "../../src"
import {createUtxos, testKeyPair} from '../util/testutils'


describe('transactionbuilder tests', () => {
    it('instantiates transactionbuilder', () => {
        const txb = new TransactionBuilder()
        expect(txb).toBeInstanceOf(TransactionBuilder)
    })
    it('rejects duplicate inputs', () => {
        const txb = new TransactionBuilder()
        const utxos = createUtxos(1,1000)
        txb.addInput(utxos.firstItem,testKeyPair.pubKey)
        expect(txb.txb.txIns.length).toBe(1)
        expect(utxos.firstItem.status).toBe('hold')
        expect(txb.hasInput(utxos.firstItem)).toBe(true)
        
        //duplicate input should fail
        expect(() => {
            txb.addInput(utxos.firstItem,testKeyPair.pubKey)
        }).toThrow(Error)
    })
    it('only spends unspent utxo', () => {
        const txb = new TransactionBuilder()
        const utxos = createUtxos(2,1000)
        utxos.items[0].encumber()
        txb.from(utxos.items, testKeyPair.pubKey)

        expect(txb.txb.txIns.length).toBe(1)
        expect(utxos.firstItem.status).toBe('hold')
        expect(utxos.items[1].status).toBe('hold')        
    })

})