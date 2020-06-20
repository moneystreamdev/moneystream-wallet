import { Wallet } from '../../src/Wallet'
import * as Long from 'long'
import { Transaction } from 'bsv'
import { KeyPair } from '../../src/KeyPair'
import { OutputCollection } from '../../src/OutputCollection'

const dustLimit = 500
const dummyOutput1 = new Transaction.UnspentOutput(
  {
      txId:"1aebb7d0776cec663cbbdd87f200bf15406adb0ef91916d102bcd7f86c86934e",
      vout:0,
      scriptPubKey:new KeyPair().fromRandom().toScript(),
      satoshis:1000
  })
  const dummyOutput2 = new Transaction.UnspentOutput(
    {
        txId:"1aebb7d0776cec663cbbdd87f200bf15406adb0ef91916d102bcd7f86c86934e",
        vout:1,
        scriptPubKey:new KeyPair().fromRandom().toScript(),
        satoshis:2000
    })
  const dummyUtxosOne = new OutputCollection()
  dummyUtxosOne.add(dummyOutput1)
  const dummyUtxosTwo = new OutputCollection()
  dummyUtxosTwo.add(dummyOutput1)
  //.filter will sort by sats and use #2 before #1
  dummyUtxosTwo.add(dummyOutput2)

describe('Wallet tests', () => {
  it('should instantiate a wallet object', () => {
    const w = new Wallet()
    expect(w).toBeInstanceOf(Wallet)
  })
  it('should create simple tx with no lock time', async () => {
    const w = new Wallet()
    w.loadWallet()
    w._selectedUtxos = dummyUtxosOne

    await w.makeSimpleSpend(Long.fromNumber(1000))
    expect (w.lastTx.nLockTime).toBe(0)
  })
  it('should create streamable tx with lock time', async () => {
    const w = new Wallet()
    w.loadWallet()
    w._selectedUtxos = dummyUtxosOne
    await w.makeAnyoneCanSpendTx(
      Long.fromNumber(1000)
    )
    expect (w.lastTx.nLockTime).toBeGreaterThan(0)
  })
  it('should create streamable tx with one input', async () => {
    const w = new Wallet()
    w.loadWallet()
    w._selectedUtxos = dummyUtxosTwo
    await w.makeAnyoneCanSpendTx(
      Long.fromNumber(dummyOutput1.satoshis-dustLimit-1)
    )
    expect (w.lastTx.inputs.length).toBe(1)
    expect (w.lastTx.outputs.length).toBe(1)
  })
  it('should create streamable tx with exactly input', async () => {
    const w = new Wallet()
    w.loadWallet()
    w._selectedUtxos = dummyUtxosTwo
    const tokensLessDust = 1000 - 500
    await w.makeAnyoneCanSpendTx(
      Long.fromNumber(tokensLessDust),
      '1KUrv2Ns8SwNkLgVKrVbSHJmdXLpsEvaDf'
    )
    expect (w.lastTx.inputs.length).toBe(1)
    expect (w.lastTx.outputs.length).toBe(2)
  })

  it('should create streamable tx with multiple inputs', async () => {
    const w = new Wallet()
    w.loadWallet()
    w._selectedUtxos = dummyUtxosTwo
    //wallet will sort utxo by sats
    await w.makeAnyoneCanSpendTx(Long.fromNumber(2500))
    expect (w.lastTx.inputs.length).toBe(2)
  })

})
