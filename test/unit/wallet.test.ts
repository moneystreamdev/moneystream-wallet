import { Wallet } from '../../src/Wallet'
import * as Long from 'long'
import { Transaction, TxOut } from 'bsv'
import { KeyPair } from '../../src/KeyPair'
import { OutputCollection } from '../../src/OutputCollection'
import { UnspentOutput } from '../../src/UnspentOutput'

const dustLimit = 500
const dummyOutput1 = new UnspentOutput(
    1000, 
    new KeyPair().fromRandom().toScript(),
    '1aebb7d0776cec663cbbdd87f200bf15406adb0ef91916d102bcd7f86c86934e',
    0
  )
  const dummyOutput2 = new UnspentOutput(
    2000, 
    new KeyPair().fromRandom().toScript(),
    '1aebb7d0776cec663cbbdd87f200bf15406adb0ef91916d102bcd7f86c86934e',
    1
  )
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

    const txhex = await w.makeSimpleSpend(Long.fromNumber(1000))
    expect (txhex.length).toBeGreaterThan(20)
    expect (w.lastTx.nLockTime).toBe(0)
    expect (w.lastTx.txIns.length).toBeGreaterThan(0)
    expect (w.lastTx.txOuts.length).toBeGreaterThan(0)
  })
  it('should create streamable tx with lock time', async () => {
    const w = new Wallet()
    w.loadWallet()
    w._selectedUtxos = dummyUtxosOne
    const txhex = await w.makeAnyoneCanSpendTx(
      Long.fromNumber(1000)
    )
    expect (txhex.length).toBeGreaterThan(20)
    expect (w.lastTx.nLockTime).toBeGreaterThan(0)
    expect (w.lastTx.txIns.length).toBeGreaterThan(0)
    expect (w.lastTx.txOuts.length).toBeGreaterThan(0)
  })
  it('should create streamable tx with one input', async () => {
    const w = new Wallet()
    w.loadWallet()
    w._selectedUtxos = dummyUtxosTwo
    const txhex = await w.makeAnyoneCanSpendTx(
      Long.fromNumber(dummyOutput1.satoshis-dustLimit-1)
    )
    expect (txhex.length).toBeGreaterThan(20)
    expect (w.lastTx.txIns.length).toBe(1)
    expect (w.lastTx.txOuts.length).toBe(1)
  })
  it('should create streamable tx with exact input', async () => {
    const w = new Wallet()
    w.loadWallet()
    w._selectedUtxos = dummyUtxosTwo
    const tokensLessDust = 1000 - 500
    const txhex = await w.makeAnyoneCanSpendTx(
      Long.fromNumber(tokensLessDust),
      '1KUrv2Ns8SwNkLgVKrVbSHJmdXLpsEvaDf'
    )
    expect (txhex.length).toBeGreaterThan(20)
    expect (w.lastTx.txIns.length).toBe(1)
    expect (w.lastTx.txOuts.length).toBe(2)
  })

  it('should create streamable tx with multiple inputs', async () => {
    const w = new Wallet()
    w.loadWallet()
    w._selectedUtxos = dummyUtxosTwo
    //wallet will sort utxo by sats, user biggest first
    const txhex = await w.makeAnyoneCanSpendTx(Long.fromNumber(2500))
    expect (txhex.length).toBeGreaterThan(20)
    console.log(w.lastTx)
    expect (w.lastTx.txIns.length).toBe(2)
    expect (w.lastTx.txOuts.length).toBe(2)
  })

})
