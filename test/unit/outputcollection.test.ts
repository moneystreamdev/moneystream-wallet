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
        expect(splits.breakdown.count()).toBe(10)
    })
    it('should not break up an empty utxo', () => {
        const utxos = new OutputCollection()
        const splits = utxos.split(10, 1000)
        expect(splits.breakdown.count()).toBe(0)
    })
    it('should filter outputs', () => {
        const utxos = createUtxos(10,1)
        expect(utxos.count()).toBe(10)
        const filtered = utxos.filter(Long.fromNumber(8))
        expect(filtered.count()).toBe(8)
    })
    it('should filter outputs', () => {
        const utxos = createUtxos(258,1000)
        expect(utxos.count()).toBe(258)
        const filtered = utxos.filter(Long.fromNumber(257*1000))
        expect(filtered.count()).toBe(257)
    })

})