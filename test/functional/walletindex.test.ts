import { Wallet } from '../../src/Wallet'
const demo_wif = 'Kyy7baVyD24NHQVJZrap3s5CvaLPUvFfEQ74eYwsBigbjEJu3HBg'

describe('real wallet works with WOC', () => {
    it ('should load wallet balance', async () => {
        const w = new Wallet()
        expect(w).toBeInstanceOf(Wallet)
        w.loadWallet(demo_wif)
        const utxos = await w.loadUnspent()
        expect(utxos.count).toBeGreaterThan(0)
        w.logUtxos(utxos.items)
        expect(w.balance).toBeGreaterThan(0)
        console.log(w.balance)
    })
})
