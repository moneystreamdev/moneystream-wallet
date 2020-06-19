import { Wallet } from '../../src/Wallet'
import * as Long from 'long'
import { Transaction } from 'bsv'
import { KeyPair } from '../../src/KeyPair'

const dummyOutput = new Transaction.UnspentOutput(
  {
      txId:"1aebb7d0776cec663cbbdd87f200bf15406adb0ef91916d102bcd7f86c86934e",
      vout:0,
      scriptPubKey:new KeyPair().fromRandom().toScript(),
      satoshis:1000
  })

describe('Wallet tests', () => {
  it('should instantiate a wallet object', () => {
    const w = new Wallet()
    expect(w).toBeInstanceOf(Wallet)
  })
  it('should create simple tx with no lock time', async () => {
    const w = new Wallet()
    w.loadWallet()
    w._utxo = dummyOutput

    await w.makeSimpleSpend(Long.fromNumber(1000))
    expect (w.lastTx.nLockTime).toBe(0)
  })
  it('should create streamable tx with lock time', async () => {
    const w = new Wallet()
    w.loadWallet()
    w._utxo = dummyOutput
    await w.makeAnyoneCanSpendTx(Long.fromNumber(1000))
    expect (w.lastTx.nLockTime).toBeGreaterThan(0)
  })
})
