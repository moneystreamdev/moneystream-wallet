import { Wallet } from '../../src/Wallet'
import { KeyPair } from '../../src/KeyPair'
import { OutputCollection } from '../../src/OutputCollection'
import { TxVerifier, TxOutMap } from 'bsv'
import * as Long from 'long'

const DUST_LIMIT = 546
const demo_wif = 'L5bxi2ef2R8LuTvQbGwkY9w6KJzpPckqRQMnjtD8D2EFqjGeJnSq'
const keyPair = new KeyPair().fromRandom()

// stream from a real wallet
// with max inputs 1 the last hex tx is the max spendable tx
describe('browse stream', () => {
    it ('should browse session', async () => {
        const w = new Wallet()
        expect(w).toBeInstanceOf(Wallet)
        w.loadWallet(demo_wif)
        await w.loadUnspent()
        expect(w.balance).toBeGreaterThan(0)
        const packetsize = 500
        const iterations = Math.floor(w.balance/packetsize)
        let utxos!: OutputCollection
        let lastBuild = null
        console.log(`streaming ${iterations} money packets`)
        for( let x = 1; x < iterations; x++) {
            const buildResult = await w.makeStreamableCashTx(
                Long.fromNumber(packetsize*x),
                null, //keyPair.toOutputScript(),
                true,
                utxos
            )
            utxos = buildResult.utxos
            lastBuild = buildResult
            w.logDetailsLastTx()
            expect(buildResult.tx.txIns.length).toBeGreaterThan(0)
            // wallet should add utxos and not leave any dust outputs
            expect (buildResult.tx.txOuts[0].valueBn.toNumber()).toBeGreaterThan(DUST_LIMIT)
            expect(w.getTxFund(buildResult.tx)).toBe(packetsize*x)
            console.log(buildResult.hex)
        }
        // there should be enough utxos for one or two more spends
        if (lastBuild) {
            const lastChange = lastBuild.tx.txOuts[0].valueBn.toNumber()
            expect(lastChange).toBeGreaterThan(DUST_LIMIT)
            expect(lastChange).toBeLessThan(DUST_LIMIT*2)
            // fully spend the last utxo
            const lastFund = w.getTxFund(lastBuild.tx)
            const buildResult = await w.makeStreamableCashTx(
                Long.fromNumber(lastFund + lastChange),
                null,
                true,
                utxos
            )
            w.logDetailsLastTx()
            // should be no change outputs, all inputs signed NONE
            expect(buildResult.tx.txOuts.length).toBe(0)
            expect(w.getTxFund(buildResult.tx)).toBe(lastFund + lastChange)

        }
    })

})