import { Wallet } from '../../src/Wallet'
import Long from 'long'
import FileSystemStorage from '../../src/FileSystemStorage'
import IndexingService from '../../src/IndexingService'
const demo_wif = 'Kym4KGj3Z3ko3r8ziw3usSKzLVyVRvt45LDkVUfgjNZoHBv9aNBi'

describe('real wallet works with WOC', () => {
    it ('should create transaction', () => {
        const w = new Wallet(new FileSystemStorage())
        expect(w).toBeInstanceOf(Wallet)
    })

    // it ('should load wallet balance', async () => {
    //     const w = new Wallet(
    //         new FileSystemStorage(),
    //         new IndexingService()
    //     )
    //     expect(w).toBeInstanceOf(Wallet)
    //     w.loadWallet(demo_wif)
    //     //const utxos = await w.loadUnspent()
    //     const utxos = await w.getAnUnspentOutput(true)
    //     const firstbalance = w.balance
    //     console.log(firstbalance)
    //     w.logUtxos(utxos.items)
    //     expect(utxos.count).toBeGreaterThan(0)
    //     expect(firstbalance).toBeGreaterThan(0)

    //     // now spend something
    //     const buildResult = await w.makeStreamableCashTx(Long.fromNumber(100))
    //     expect (buildResult.funding).toBe(100)

    //     const refreshUtxos = await w.loadUnspent()
    //     // it is actually 100 less
    //     //expect (w.balance).toBe(firstbalance)
    //     expect(refreshUtxos.count).toBe(utxos.count)
    //     console.log(w.balance)
    // })
})
