import { Wallet } from '../../src/Wallet'
import * as Long from 'long'
import { KeyPair } from '../../src/KeyPair'
import { OutputCollection } from '../../src/OutputCollection'
import { UnspentOutput } from '../../src/UnspentOutput'

const dustLimit = 500
const someHashBufString = '1aebb7d0776cec663cbbdd87f200bf15406adb0ef91916d102bcd7f86c86934e'
const dummyOutput1 = new UnspentOutput(
    1000, 
    new KeyPair().fromRandom().toOutputScript(),
    someHashBufString,
    0
  )
  const dummyOutput2 = new UnspentOutput(
    2000, 
    new KeyPair().fromRandom().toOutputScript(),
    someHashBufString,
    1
  )
  
  function makeDummyTwo() {
    const dummyUtxosTwo = new OutputCollection()
    dummyUtxosTwo.add(new UnspentOutput(
      1000, 
      new KeyPair().fromRandom().toOutputScript(),
      someHashBufString,
      0
    ))
    //.filter will sort by sats and use #2 before #1
    dummyUtxosTwo.add(new UnspentOutput(
      2000, 
      new KeyPair().fromRandom().toOutputScript(),
      someHashBufString,
      1
    ))
    return dummyUtxosTwo
  }

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

describe('Wallet tests', () => {
  it('should instantiate a wallet object', () => {
    const w = new Wallet()
    expect(w).toBeInstanceOf(Wallet)
  })
  it('should error if wallet not loaded', async () => {
    const w = new Wallet()
    w.selectedUtxos = createUtxos(1,1000)
    await expect(
      w.makeSimpleSpend(Long.fromNumber(600))
    ).rejects.toThrow(Error)
    
  })
  it('should create simple tx with no lock time', async () => {
    const w = new Wallet()
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,1000)

    const buildResult = await w.makeSimpleSpend(Long.fromNumber(600))
    expect (buildResult.hex.length).toBeGreaterThan(20)
    expect (w.lastTx.nLockTime).toBe(0)
    expect (w.lastTx.txIns.length).toBeGreaterThan(0)
    expect (w.lastTx.txOuts.length).toBeGreaterThan(0)
    w.logDetailsLastTx()
  })
  it('should create streamable tx with lock time', async () => {
    const w = new Wallet()
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,1000)
    const buildResult = await w.makeAnyoneCanSpendTx(
      Long.fromNumber(1000)
    )
    expect (buildResult.hex.length).toBeGreaterThan(20)
    expect (w.lastTx.nLockTime).toBeGreaterThan(0)
    expect (w.lastTx.txIns.length).toBeGreaterThan(0)
    expect (w.lastTx.txOuts.length).toBeGreaterThan(0)
  })
  it('should create streamable tx with no lock time', async () => {
    const w = new Wallet()
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,1000)
    const buildResult = await w.makeAnyoneCanSpendTx(
      Long.fromNumber(1000), undefined, false
    )
    expect (buildResult.hex.length).toBeGreaterThan(20)
    expect (w.lastTx.nLockTime).toBe(0)
    expect (w.lastTx.txIns.length).toBeGreaterThan(0)
    expect (w.lastTx.txOuts.length).toBeGreaterThan(0)
  })
  it('should create streamable tx with one input', async () => {
    const w = new Wallet()
    w.loadWallet()
    w.selectedUtxos = makeDummyTwo()
    const buildResult = await w.makeAnyoneCanSpendTx(
      Long.fromNumber(dummyOutput1.satoshis-dustLimit-1)
    )
    expect (buildResult.hex.length).toBeGreaterThan(20)
    expect (w.lastTx.txIns.length).toBe(1)
    expect (w.lastTx.txOuts.length).toBe(1)
  })
  it('should create streamable tx with exact input', async () => {
    const w = new Wallet()
    w.loadWallet()
    w.selectedUtxos = makeDummyTwo()
    const tokensLessDust = 1000 - 500
    const buildResult = await w.makeAnyoneCanSpendTx(
      Long.fromNumber(tokensLessDust),
      '1KUrv2Ns8SwNkLgVKrVbSHJmdXLpsEvaDf'
    )
    expect (buildResult.hex.length).toBeGreaterThan(20)
    expect (w.lastTx.txIns.length).toBe(1)
    expect (w.lastTx.txOuts.length).toBe(2)
  })

  it('should create streamable tx with multiple inputs', async () => {
    const w = new Wallet()
    w.loadWallet()
    w.selectedUtxos = makeDummyTwo()
    //wallet will sort utxo by sats, use biggest first
    const buildResult = await w.makeAnyoneCanSpendTx(Long.fromNumber(2500))
    expect (buildResult.hex.length).toBeGreaterThan(20)
    expect (w.lastTx.txIns.length).toBe(2)
    expect (w.lastTx.txOuts.length).toBe(2)
    expect(w.lastTx.txOuts[0].valueBn.toNumber()).toBe(0)
    expect(w.lastTx.txOuts[1].valueBn.toNumber()).toBe(500)
    expect(w.getTxFund(w.lastTx)).toBe(2500)
  })
  it('funds tx with one input', async () => {
    const w = new Wallet()
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,1000)
    const txhex = await w.makeAnyoneCanSpendTx(Long.fromNumber(100))
    expect(w.lastTx).toBeDefined()
    expect(w.getTxFund(w.lastTx)).toBe(100)
  })
  it ('should log utxos', () => {
    const w = new Wallet()
    w.selectedUtxos = makeDummyTwo()
    w.logUtxos(w.selectedUtxos.items)
  })
  it('should create tx to split a utxo', async () => {
    const w = new Wallet()
    w.loadWallet()
    const utxos = new OutputCollection()
    utxos.add(new UnspentOutput(10000,w.keyPair.toOutputScript(),someHashBufString,0))
    w.selectedUtxos = utxos
    const txsplit = await w.split(10,1000)
    expect(w.lastTx.txIns.length).toBe(1)
    expect(w.lastTx.txOuts.length).toBe(10)
    expect(w.lastTx.txOuts[0].valueBn.toNumber()).toBe(1000)
    expect(w.lastTx.txOuts[9].valueBn.toNumber()).toBe(500)
  })
  it('should get wallet balance', async () => {
    const w = new Wallet()
    w.loadWallet()
    const lotsOfUtxos = createUtxos(9,1)
    expect(lotsOfUtxos.count).toBe(9)
    w.selectedUtxos = lotsOfUtxos
    expect(w.balance).toBe(9)
  })
  it('should create streamable tx with more than 256 inputs', async () => {
    const w = new Wallet()
    w.loadWallet()
    const lotsOfUtxos = createUtxos(258,1000)
    expect(lotsOfUtxos.count).toBe(258)
    w.selectedUtxos = lotsOfUtxos
    const buildResult = await w.makeAnyoneCanSpendTx(
      Long.fromNumber(257*1000)
    )
    expect (buildResult.hex.length).toBeGreaterThan(20)
    expect (w.lastTx.nLockTime).toBeGreaterThan(0)
    expect (w.lastTx.txIns.length).toBe(257)
    expect (w.lastTx.txOuts.length).toBeGreaterThan(0)
  })
  it('encumbers utxo', async () => {
    const w = new Wallet()
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,1000)
    const txhex = await w.makeAnyoneCanSpendTx(Long.fromNumber(100))
    expect(w.lastTx).toBeDefined()
    expect(w.getTxFund(w.lastTx)).toBe(100)
    expect(w.selectedUtxos.firstItem.status).toBe('hold')
  })
  it('errors mulitple streams one utxo', async () => {
    const w = new Wallet()
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,1000)
    const stream1 = await w.makeAnyoneCanSpendTx(Long.fromNumber(100))
    expect(w.lastTx).toBeDefined()
    expect(w.getTxFund(w.lastTx)).toBe(100)
    expect(w.selectedUtxos.firstItem.status).toBe('hold')
    //this should error
    expect(
      w.makeAnyoneCanSpendTx(Long.fromNumber(100))
    ).rejects.toThrow(Error)
  })

})
