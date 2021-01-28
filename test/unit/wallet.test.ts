import { Wallet } from '../../src/Wallet'
import { existsSync, unlinkSync } from 'fs'
import * as Long from 'long'
import { KeyPair } from '../../src/KeyPair'
import { OutputCollection } from '../../src/OutputCollection'
import { UnspentOutput } from '../../src/UnspentOutput'
import { Bn, Script, TxOut } from 'bsv'
import FileSystemStorage from '../../src/FileSystemStorage'

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

  // tx with no inputs and no outputs
  const nofundinghex = '0100000000000d1b345f'

describe('Wallet tests', () => {
  it('should instantiate a wallet object', () => {
    const w = new Wallet(new FileSystemStorage())
    expect(w).toBeInstanceOf(Wallet)
  })
  it('should error if wallet not loaded', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.selectedUtxos = createUtxos(1,1000)
    await expect(
      w.makeSimpleSpend(Long.fromNumber(600))
    ).rejects.toThrow(Error)
  })
  it('should spend to address', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,10000)
    const buildResult = await w.makeSimpleSpend(Long.fromNumber(600), undefined, '1SCVmCzdLaECeRkMq3egwJ6yJLwT1x3wu')
    expect(buildResult.hex).toBeDefined()
    w.logDetailsLastTx()
    expect(buildResult.tx.txOuts[0].valueBn.toNumber()).toBe(600)
    //must have change output
    expect(buildResult.tx.txOuts[1].valueBn.toNumber()).toBe(9100)
  })
  it('should clear wallet', () => {
    const w = new Wallet(new FileSystemStorage())
    w.selectedUtxos = createUtxos(1,1000)
    expect(w.balance).toBe(1000)
    w.clear()
    expect(w.balance).toBe(0)
    expect(w.selectedUtxos.hasAny()).toBeFalsy()
  })
  it('should create simple tx with no lock time', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,1000)

    const buildResult = await w.makeSimpleSpend(Long.fromNumber(600))
    expect (buildResult.hex.length).toBeGreaterThan(20)
    expect (buildResult.tx.nLockTime).toBe(0)
    expect (buildResult.tx.txIns.length).toBeGreaterThan(0)
    expect (buildResult.tx.txOuts.length).toBeGreaterThan(0)
    expect(buildResult.tx.txOuts[0].valueBn.toNumber()).toBe(600)
    w.logDetailsLastTx()
  })
  it('should create streamable tx with lock time', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,1000)
    const buildResult = await w.makeStreamableCashTx(
      Long.fromNumber(1000)
    )
    expect(buildResult.funding).toBe(1000)
    expect(w.selectedUtxos.items[0].amountSpent).toBe(1000)
    expect(w.selectedUtxos.items[0].balance).toBe(0)
    expect (buildResult.hex.length).toBeGreaterThan(20)
    expect (buildResult.tx.nLockTime).toBeGreaterThan(0)
    expect (buildResult.tx.txIns.length).toBeGreaterThan(0)
    expect (buildResult.tx.txOuts.length).toBe(0)
    expect(w.getTxFund(buildResult.tx)).toBe(1000)
    // add extra output
    buildResult.tx.addTxOut(new Bn().fromNumber(1), new KeyPair().fromRandom().toOutputScript())
    // funding should not change
    expect(w.getTxFund(buildResult.tx)).toBe(1000)
    expect(w.balance).toBe(0)
  })
  it('should create streamable tx with no lock time', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,1000)
    const buildResult = await w.makeStreamableCashTx(
      Long.fromNumber(1000), undefined, false
    )
    expect(buildResult.funding).toBe(1000)
    expect(w.selectedUtxos.items[0].amountSpent).toBe(1000)
    expect(w.selectedUtxos.items[0].balance).toBe(0)
    expect (buildResult.hex.length).toBeGreaterThan(20)
    expect (buildResult.tx.nLockTime).toBe(0)
    expect (buildResult.tx.txIns.length).toBeGreaterThan(0)
    expect (buildResult.tx.txOuts.length).toBe(0)
    expect(w.balance).toBe(0)
  })
  it('should create streamable tx with one input', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.selectedUtxos = makeDummyTwo()
    const buildResult = await w.makeStreamableCashTx(
      Long.fromNumber(1000-500-1)
    )
    expect(buildResult.funding).toBe(1000-500-1)
    expect(w.selectedUtxos.items[0].amountSpent).toBe(0)
    expect(w.selectedUtxos.items[0].balance).toBe(1000)
    expect(w.selectedUtxos.items[1].amountSpent).toBe(499)
    expect(w.selectedUtxos.items[1].balance).toBe(1501)
    expect (buildResult.hex.length).toBeGreaterThan(20)
    expect (buildResult.tx.txIns.length).toBe(1)
    expect (buildResult.tx.txOuts.length).toBe(1)
    expect(w.balance).toBe(3000-499)
  })
  it('should create streamable tx with exact input', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.selectedUtxos = makeDummyTwo()
    const tokensLessDust = 1000 - 500
    const buildResult = await w.makeStreamableCashTx(
      Long.fromNumber(tokensLessDust),
      new KeyPair().fromRandom().toOutputScript()
    )
    expect(buildResult.funding).toBe(tokensLessDust)
    expect(w.selectedUtxos.items[0].amountSpent).toBe(0)
    expect(w.selectedUtxos.items[0].balance).toBe(1000)
    expect(w.selectedUtxos.items[1].amountSpent).toBe(500)
    expect(w.selectedUtxos.items[1].balance).toBe(1500)
    expect (buildResult.hex.length).toBeGreaterThan(20)
    expect (buildResult.tx.txIns.length).toBe(1)
    expect (buildResult.tx.txOuts.length).toBe(2)
    expect(w.balance).toBe(2500)
  })

  it('should create streamable tx with multiple inputs', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.selectedUtxos = makeDummyTwo()
    //wallet will sort utxo by sats, use biggest first
    const buildResult = await w.makeStreamableCashTx(Long.fromNumber(2500))
    expect(buildResult.funding).toBe(2500)
    expect(w.selectedUtxos.items[0].amountSpent).toBe(500)
    expect(w.selectedUtxos.items[0].balance).toBe(500)
    expect(w.selectedUtxos.items[1].amountSpent).toBe(2000)
    expect(w.selectedUtxos.items[1].balance).toBe(0)
    expect(buildResult.hex.length).toBeGreaterThan(20)
    expect(buildResult.tx.txIns.length).toBe(2)
    expect(buildResult.tx.txOuts.length).toBe(1)
    expect(buildResult.tx.txOuts[0].valueBn.toNumber()).toBe(500)
    expect(w.getTxFund(w.lastTx)).toBe(2500)
    // add an output, funding doesnt change
    buildResult.tx.addTxOut(new Bn().fromNumber(100), w.keyPair.toOutputScript()) 
    expect(w.getTxFund(w.lastTx)).toBe(2500)
    expect(w.balance).toBe(500)
  })
  it('should create streamable tx with increasing', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.selectedUtxos = makeDummyTwo()
    //wallet will sort utxo by sats, use biggest first
    const buildResult = await w.makeStreamableCashTx(Long.fromNumber(100))
    expect(buildResult.funding).toBe(100)
    expect(w.selectedUtxos.items[0].amountSpent).toBe(0)
    expect(w.selectedUtxos.items[0].balance).toBe(1000)
    expect(w.selectedUtxos.items[1].amountSpent).toBe(100)
    expect(w.selectedUtxos.items[1].balance).toBe(1900)
    expect(buildResult.hex.length).toBeGreaterThan(20)
    expect(buildResult.tx.txIns.length).toBe(1)
    expect(buildResult.tx.txOuts.length).toBe(1)
    expect(buildResult.tx.txOuts[0].valueBn.toNumber()).toBe(1900)
    //expect(buildResult.tx.txOuts[1].valueBn.toNumber()).toBe(500)
    expect(w.getTxFund(w.lastTx)).toBe(100)
    expect(w.balance).toBe(2900)
    const buildResult2 = await w.makeStreamableCashTx(
        Long.fromNumber(2100),null,true,buildResult.utxos
    )
    expect(buildResult2.funding).toBe(2100)
    expect(w.selectedUtxos.items[0].amountSpent).toBe(100)
    expect(w.selectedUtxos.items[0].balance).toBe(900)
    expect(w.selectedUtxos.items[1].amountSpent).toBe(2000)
    expect(w.selectedUtxos.items[1].balance).toBe(0)
    expect(buildResult2.hex.length).toBeGreaterThan(20)
    expect(buildResult2.tx.txIns.length).toBe(2)
    w.logDetailsLastTx()
    expect(w.getTxFund(buildResult2.tx)).toBe(2100)
    expect(buildResult2.tx.txOuts.length).toBe(1)
    expect(buildResult2.tx.txOuts[0].valueBn.toNumber()).toBe(900)
    expect(w.balance).toBe(900)
  })
  it('funds tx with one input', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,1000)
    const buildResult = await w.makeStreamableCashTx(Long.fromNumber(100))
    expect(buildResult.funding).toBe(100)
    expect(w.selectedUtxos.items[0].amountSpent).toBe(100)
    expect(w.selectedUtxos.items[0].balance).toBe(900)
    expect(buildResult.tx).toBeDefined()
    expect(w.getTxFund(w.lastTx)).toBe(100)
    expect(w.balance).toBe(900)
  })
  it ('should log utxos', () => {
    const w = new Wallet(new FileSystemStorage())
    w.selectedUtxos = makeDummyTwo()
    w.logUtxos(w.selectedUtxos.items)
  })
  it('should create tx to split a utxo', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    const utxos = new OutputCollection()
    utxos.add(new UnspentOutput(10000,w.keyPair.toOutputScript(),someHashBufString,0))
    // 10000-140/10
    const buildResult = await w.split(utxos,10,1000)
    expect(buildResult?.tx.txIns.length).toBe(1)
    expect(buildResult?.tx.txOuts.length).toBe(10)
    expect(buildResult?.tx.txOuts[0].valueBn.toNumber()).toBe(974)
    expect(buildResult?.tx.txOuts[9].valueBn.toNumber()).toBe(974)
    // fee will be 10000 - 945*10
  })
  it('should create tx to split a utxo', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    const utxos = new OutputCollection()
    utxos.add(new UnspentOutput(3611,w.keyPair.toOutputScript(),someHashBufString,0))
    utxos.add(new UnspentOutput(3450,w.keyPair.toOutputScript(),someHashBufString,1))
    utxos.add(new UnspentOutput(5323,w.keyPair.toOutputScript(),someHashBufString,2))
    utxos.add(new UnspentOutput(2987,w.keyPair.toOutputScript(),someHashBufString,3))
    utxos.add(new UnspentOutput(2987,w.keyPair.toOutputScript(),someHashBufString,4))
    utxos.add(new UnspentOutput(2487,w.keyPair.toOutputScript(),someHashBufString,5))
    const total = 5323 //utxos.satoshis
    const count = 7
    const splitAmount = Math.floor(total/count)
    const buildResult = await w.split(utxos,count,600)
    expect(buildResult?.tx.txIns.length).toBe(1)
    expect(buildResult?.tx.txOuts.length).toBe(count)
    expect(buildResult?.tx.txOuts[0].valueBn.toNumber()).toBe(600)
    expect(buildResult?.tx.txOuts[count-1].valueBn.toNumber()).toBeGreaterThan(545)
    expect(splitAmount).toBeGreaterThan(545)
    //TODO: make sure fee is reasonable before broadcast
    w.logDetails(buildResult?.tx)
  })
  it('should get wallet balance', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    const lotsOfUtxos = createUtxos(9,1)
    expect(lotsOfUtxos.count).toBe(9)
    w.selectedUtxos = lotsOfUtxos
    expect(w.balance).toBe(9)
  })
  it('should create streamable tx with more than 256 inputs', async () => {
    const size = 258
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    const lotsOfUtxos = createUtxos(size,1000)
    expect(lotsOfUtxos.count).toBe(size)
    w.selectedUtxos = lotsOfUtxos
    const buildResult = await w.makeStreamableCashTx(
      Long.fromNumber(size*1000)
    )
    expect(buildResult.funding).toBe(size*1000)
    expect(w.selectedUtxos.items[0].amountSpent).toBe(1000)
    expect(w.selectedUtxos.items[0].balance).toBe(0)
    expect(w.selectedUtxos.items[size-1].amountSpent).toBe(1000)
    expect(w.selectedUtxos.items[size-1].balance).toBe(0)
    expect (buildResult.hex.length).toBeGreaterThan(20)
    expect (buildResult?.tx.nLockTime).toBeGreaterThan(0)
    expect (buildResult?.tx.txIns.length).toBe(size)
    expect (buildResult?.tx.txOuts.length).toBe(0)
    expect(w.balance).toBe(0)
  })
  it('encumbers utxo', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,1000)
    const buildResult = await w.makeStreamableCashTx(Long.fromNumber(100))
    expect(buildResult?.tx).toBeDefined()
    expect(buildResult.funding).toBe(100)
    expect(w.selectedUtxos.items[0].amountSpent).toBe(100)
    expect(w.selectedUtxos.items[0].balance).toBe(900)
    expect(w.getTxFund(w.lastTx)).toBe(100)
    expect(w.selectedUtxos.firstItem.status).toBe('hold')
    expect(w.balance).toBe(900)
  })
  it('errors multiple streams one utxo', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,1000)
    const stream1 = await w.makeStreamableCashTx(Long.fromNumber(100))
    expect(stream1.tx).toBeDefined()
    expect(stream1.funding).toBe(100)
    expect(w.selectedUtxos.items[0].amountSpent).toBe(100)
    expect(w.selectedUtxos.items[0].balance).toBe(900)
    expect(w.getTxFund(w.lastTx)).toBe(100)
    expect(w.selectedUtxos.firstItem.status).toBe('hold')
    //this should error because single utxo already encumbered
    expect(
      w.makeStreamableCashTx(Long.fromNumber(100))
    ).rejects.toThrow(Error)
  })
  it ('should error making empty transaction', async () => {
    const w = new Wallet(new FileSystemStorage())
    expect(w).toBeInstanceOf(Wallet)
    w.loadWallet()
    // should error because stream cannot be funded
    // at all
    expect(
      w.makeStreamableCashTx(
        Long.fromNumber(250),
        null,true, new OutputCollection()
      )
    ).rejects.toThrow(Error)
  })
  it('tests funding zero', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.allowZeroFunding = true
    w.loadWallet()
    w.selectedUtxos = new OutputCollection()
    const buildResult = await w.makeStreamableCashTx(Long.fromNumber(0))
    expect(buildResult?.tx).toBeDefined()
    expect(w.fundingInputCount).toBe(0)
    expect(buildResult.funding).toBe(0)
    expect(w.getTxFund(buildResult.tx)).toBe(0)
    expect(w.senderOutputCount).toBe(0)
    buildResult.tx.addTxIn(someHashBufString,0, new Script())
    const utxo = UnspentOutput.fromTxOut(
      TxOut.fromProperties(
        new Bn(999), 
        w.keyPair.toOutputScript()
      ), someHashBufString,0
    )
    w.selectedUtxos.add(utxo)
    buildResult.tx.addTxOut(new Bn().fromNumber(100), w.keyPair.toOutputScript()) 
    w.logDetailsLastTx()
    expect(w.senderOutputCount).toBe(0)
    expect(w.fundingInputCount).toBe(0)
    const txinout = w.getInputOutput(buildResult.tx.txIns[0],0)
    expect(txinout).toBeInstanceOf(UnspentOutput)
    expect(w.getTxFund(buildResult.tx)).toBe(0)
    expect(w.balance).toBe(999)
  })
  it('tests funding more', async () => {
    // what to do if user wants to make tx with 0 funding?
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,1000)
    const buildResult = await w.makeStreamableCashTx(Long.fromNumber(0))
    expect(buildResult?.tx).toBeDefined()
    expect(buildResult.funding).toBe(0)
    expect(w.selectedUtxos.items[0].amountSpent).toBe(0)
    expect(w.selectedUtxos.items[0].balance).toBe(1000)
    expect(w.fundingInputCount).toBe(1)
    expect(w.senderOutputCount).toBe(1)
    expect(w.getTxFund(buildResult.tx)).toBe(0)
    expect(w.balance).toBe(1000)
    // add more inputs and outputs, not part of funding
    buildResult.tx.addTxIn(someHashBufString,0, new Script()) 
    buildResult.tx.addTxOut(new Bn().fromNumber(100), w.keyPair.toOutputScript()) 
    expect(w.senderOutputCount).toBe(1)
    expect(w.fundingInputCount).toBe(1)
    w.logDetailsLastTx()
    expect(w.getTxFund(buildResult.tx)).toBe(0)
    expect(w.balance).toBe(1000)
  })
  it('adds data output', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,1000)
    const buildResult = await w.makeStreamableCashTx(
      Long.fromNumber(100),
      null, true, undefined, 
      Buffer.from('moneystream')
      )
    w.logDetailsLastTx()
    expect(buildResult?.tx).toBeDefined()
    expect(buildResult.funding).toBe(100)
    expect(w.selectedUtxos.items[0].amountSpent).toBe(100)
    expect(w.selectedUtxos.items[0].balance).toBe(900)
    expect(w.getTxFund(w.lastTx)).toBe(100)
    expect(buildResult.tx.txOuts.length).toBe(2)
    expect(buildResult.tx.txOuts[1].script.isSafeDataOut()).toBeTruthy()
    expect(w.balance).toBe(900)
  })
  it('adds payto', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,1000)
    const buildResult = await w.makeStreamableCashTx(
      Long.fromNumber(100),
      w.keyPair.toOutputScript(), 
      true, undefined
      )
    w.logDetailsLastTx()
    expect(buildResult?.tx).toBeDefined()
    expect(buildResult.funding).toBe(100)
    expect(w.selectedUtxos.items[0].amountSpent).toBe(100)
    expect(w.selectedUtxos.items[0].balance).toBe(900)
    expect(w.getTxFund(w.lastTx)).toBe(100)
    expect(buildResult.tx.txOuts.length).toBe(2)
    expect(w.balance).toBe(900)
  })
  it('adds payto array single', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,1000)
    const buildResult = await w.makeStreamableCashTx(
      Long.fromNumber(100),
      [{to: w.keyPair.toOutputScript(), percent:100 }], 
      true, undefined
      )
    w.logDetailsLastTx()
    expect(buildResult.funding).toBe(100)
    expect(buildResult?.tx).toBeDefined()
    expect(w.selectedUtxos.items[0].amountSpent).toBe(100)
    expect(w.selectedUtxos.items[0].balance).toBe(900)
    expect(w.getTxFund(w.lastTx)).toBe(100)
    expect(w.getTxSummary(w.lastTx).output).toBe(1000)
    expect(buildResult.tx.txOuts.length).toBe(2)
    expect(w.balance).toBe(900)
  })
  it('adds payto array double', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,1000)
    const buildResult = await w.makeStreamableCashTx(
      Long.fromNumber(100),
      [
        {to: w.keyPair.toOutputScript(), percent:50 },
        {to: w.keyPair.toOutputScript(), percent:50 },
      ], 
      true, undefined
      )
    w.logDetailsLastTx()
    expect(buildResult?.tx).toBeDefined()
    expect(buildResult.funding).toBe(100)
    expect(w.selectedUtxos.items[0].amountSpent).toBe(100)
    expect(w.selectedUtxos.items[0].balance).toBe(900)
    expect(w.getTxFund(w.lastTx)).toBe(100)
    expect(w.getTxSummary(w.lastTx).output).toBe(1000)
    expect(buildResult.tx.txOuts.length).toBe(3)
    expect(w.balance).toBe(900)
  })
  it('adds payto array tripple', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,2000)
    const buildResult = await w.makeStreamableCashTx(
      Long.fromNumber(1000),
      [
        {to: w.keyPair.toOutputScript(), percent:33.4 },
        {to: w.keyPair.toOutputScript(), percent:33.3 },
        {to: w.keyPair.toOutputScript(), percent:33.3 },
      ], 
      true, undefined
      )
    w.logDetailsLastTx()
    expect(buildResult?.tx).toBeDefined()
    expect(buildResult.funding).toBe(1000)
    expect(w.selectedUtxos.items[0].amountSpent).toBe(1000)
    expect(w.selectedUtxos.items[0].balance).toBe(1000)
    expect(w.getTxFund(w.lastTx)).toBe(1000)
    expect(w.getTxSummary(w.lastTx).output).toBe(2000)
    expect(buildResult.tx.txOuts.length).toBe(4)
    expect(w.balance).toBe(1000)
  })
  it('adds payto array tripple', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,1000)
    const buildResult = await w.makeStreamableCashTx(
      Long.fromNumber(100),
      [
        {to: w.keyPair.toOutputScript(), percent:33.4 },
        {to: w.keyPair.toOutputScript(), percent:33.3 },
        {to: w.keyPair.toOutputScript(), percent:33.3 },
      ], 
      true, undefined
      )
    w.logDetailsLastTx()
    expect(buildResult?.tx).toBeDefined()
    expect(buildResult.funding).toBe(100)
    expect(w.selectedUtxos.items[0].amountSpent).toBe(100)
    expect(w.selectedUtxos.items[0].balance).toBe(900)
    expect(w.getTxFund(w.lastTx)).toBe(100)
    expect(w.getTxSummary(w.lastTx).output).toBe(1000)
    expect(buildResult.tx.txOuts.length).toBe(4)
    expect(w.balance).toBe(900)
  })
  it('adds payto array tripple', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,1000)
    const buildResult = await w.makeStreamableCashTx(
      Long.fromNumber(100),
      [
        {to: w.keyPair.toOutputScript(), percent:25 },
        {to: w.keyPair.toOutputScript(), percent:50 },
        {to: w.keyPair.toOutputScript(), percent:25 },
      ], 
      true, undefined
      )
    w.logDetailsLastTx()
    expect(buildResult?.tx).toBeDefined()
    expect(buildResult.funding).toBe(100)
    expect(w.selectedUtxos.items[0].amountSpent).toBe(100)
    expect(w.selectedUtxos.items[0].balance).toBe(900)
    expect(w.getTxFund(w.lastTx)).toBe(100)
    expect(w.getTxSummary(w.lastTx).output).toBe(1000)
    expect(buildResult.tx.txOuts.length).toBe(4)
    expect(w.balance).toBe(900)
  })
  it('should load json', async () => {
    //TODO: mock the file system
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.fileName='wallet.test.json'
    await w.store(w.toJSON())
    expect(existsSync(w.fileName)).toBe(true)
    const w2 = new Wallet(new FileSystemStorage())
    w2.loadWalletFromJSON(w.fileName)
    expect(w.keyPair.toWif()).toBe(w2.keyPair.toWif())
    unlinkSync(w.fileName)
  })

  it('replaces utxo', async () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    w.selectedUtxos = createUtxos(1,1000)
    const buildResult = await w.makeStreamableCashTx(Long.fromNumber(100))
    expect(buildResult?.tx).toBeDefined()
    expect(buildResult.funding).toBe(100)
    expect(w.selectedUtxos.items[0].amountSpent).toBe(100)
    expect(w.selectedUtxos.items[0].balance).toBe(900)
    expect(w.getTxFund(w.lastTx)).toBe(100)
    expect(w.selectedUtxos.firstItem.status).toBe('hold')
    expect(w.balance).toBe(900)
    w.spendUtxos(buildResult.utxos, buildResult.tx, 0, buildResult.tx.id())
    expect(w.balance).toBe(900)
    expect(w.selectedUtxos.count).toBe(2)
    expect(w.selectedUtxos.spendable().count).toBe(1)
    expect(w.selectedUtxos.spent().count).toBe(1)
  })
  it('adds wallet funding', () => {
    const w = new Wallet(new FileSystemStorage())
    w.loadWallet()
    expect(w.balance).toBe(0)
    w.addUnspent({
      satoshis:999,
      txid:'123'
    })
    expect(w.balance).toBe(999)
  })

})
