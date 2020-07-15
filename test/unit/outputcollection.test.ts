import { OutputCollection } from '../../src/OutputCollection'
import { UnspentOutput, KeyPair } from '../../src'
import * as Long from 'long'

const someHashBufString = '1aebb7d0776cec663cbbdd87f200bf15406adb0ef91916d102bcd7f86c86934e'
function createUtxos(count:number, satoshis:number):OutputCollection {
    const lotsOfUtxos = new OutputCollection()
    for (let index = 0; index < count; index++) {
      const testUtxo = new UnspentOutput(
        satoshis,
        new KeyPair().fromRandom().toOutputScript(),
        someHashBufString,
        index
      )
      lotsOfUtxos.add(testUtxo)
    }
    return lotsOfUtxos
  }

describe('output collection tests', () => {
    it('should instantiate', () => {
        const utxos = new OutputCollection()
        expect(utxos).toBeInstanceOf(OutputCollection)
        expect(utxos.hasAny()).toBeFalsy()
    })
    it('should break up a utxo', () => {
        const utxos = new OutputCollection()
        utxos.add(new UnspentOutput(10000,''))
        const splits = utxos.split(10, 1000)
        expect(splits.breakdown.count).toBe(10)
    })
    it('should not break up an empty utxo', () => {
        const utxos = new OutputCollection()
        const splits = utxos.split(10, 1000)
        expect(splits.breakdown.count).toBe(0)
    })
    it('should filter outputs', () => {
        const utxos = createUtxos(10,1)
        expect(utxos.count).toBe(10)
        const filtered = utxos.filter(Long.fromNumber(8))
        expect(filtered.count).toBe(8)
    })
    it('should filter outputs', () => {
        const utxos = createUtxos(258,1000)
        expect(utxos.count).toBe(258)
        const filtered = utxos.filter(Long.fromNumber(257*1000))
        expect(filtered.count).toBe(257)
    })
    it('should get spendable outputs', () => {
        const utxos = createUtxos(10,1)
        expect(utxos.spendable().count).toBe(10)
        expect(utxos.encumbered().count).toBe(0)
        expect(utxos.spent().count).toBe(0)
        utxos.firstItem.spend()
        expect(utxos.spendable().count).toBe(9)
        expect(utxos.encumbered().count).toBe(0)
        expect(utxos.spent().count).toBe(1)
        utxos.lastItem.spend()
        expect(utxos.spendable().count).toBe(8)
        expect(utxos.encumbered().count).toBe(0)
        expect(utxos.spent().count).toBe(2)
        utxos.firstItem.encumber()
        expect(utxos.spendable().count).toBe(8)
        expect(utxos.encumbered().count).toBe(1)
        expect(utxos.spent().count).toBe(1)
        utxos.lastItem.encumber()
        expect(utxos.spendable().count).toBe(8)
        expect(utxos.encumbered().count).toBe(2)
        expect(utxos.spent().count).toBe(0)
    })
    it('should get output to json', () => {
        const utxos = createUtxos(2,1)
        expect(utxos.count).toBe(2)
        utxos.firstItem.encumber()
        const sx = JSON.stringify(utxos)
        const rehydrate = OutputCollection.fromJSON(JSON.parse(sx))
        expect(rehydrate).toBeInstanceOf(OutputCollection)
        expect(rehydrate.count).toBe(2)
        expect(rehydrate.spendable().count).toBe(1)
        expect(rehydrate.spendable().satoshis).toBe(1)
    })
    it ('should not add duplicate outputs', () => {
        const outputs = new OutputCollection()
        const txout = new UnspentOutput(1,null,someHashBufString,99)
        outputs.add_conditional(txout)
        expect(outputs.count).toBe(1)
        outputs.add_conditional(txout)
        expect(outputs.count).toBe(1)
    })
    it ('should find by attribute', () => {
        const outputs = new OutputCollection()
        const txout = new UnspentOutput(1,null,someHashBufString,99)
        outputs.add_conditional(txout)
        expect(outputs.count).toBe(1)
        const txfound = outputs.find(Buffer.from(someHashBufString,'hex'), 99)
        expect(txfound).toBeDefined()
        expect(txfound?.txId).toBe(txout.txId)
    })
    it ('should find by txout', () => {
        const outputs = new OutputCollection()
        const txout = new UnspentOutput(1,null,someHashBufString,99)
        outputs.add_conditional(txout)
        expect(outputs.count).toBe(1)
        const txfound = outputs.findTxOut(txout)
        expect(txfound).toBeDefined()
        expect(txfound?.txId).toBe(txout.txId)
    })

})