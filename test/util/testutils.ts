import {OutputCollection} from '../../src/OutputCollection'
import {UnspentOutput} from '../../src/UnspentOutput'
import {KeyPair} from '../../src/KeyPair'

export const testKeyPair = new KeyPair().fromRandom()
export const someHashBufString = '1aebb7d0776cec663cbbdd87f200bf15406adb0ef91916d102bcd7f86c86934e'

export function createUtxos(count:number, satoshis:number):OutputCollection {
    const lotsOfUtxos = new OutputCollection()
    for (let index = 0; index < count; index++) {
      const testUtxo = new UnspentOutput(
        satoshis,
        testKeyPair.toOutputScript(),
        someHashBufString,
        index
      )
      lotsOfUtxos.add(testUtxo)
    }
    return lotsOfUtxos
  }
