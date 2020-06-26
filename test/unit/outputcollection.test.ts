import { OutputCollection } from '../../src/OutputCollection'
import { UnspentOutput } from '../../src'

describe('output collection tests', () => {
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

})