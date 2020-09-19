import { Wallet } from '../../src/Wallet'
import { KeyPair } from '../../src/KeyPair'
import { OutputCollection } from '../../src/OutputCollection'
import { TxVerifier, TxOutMap } from 'bsv'
import * as Long from 'long'

const DUST_LIMIT = 140
const demo_wif = 'L5bxi2ef2R8LuTvQbGwkY9w6KJzpPckqRQMnjtD8D2EFqjGeJnSq'
const keyPair = new KeyPair().fromRandom()

// This is a functional test, not a unit test
// stream from a real wallet
// with max inputs 1 the last hex tx is the max spendable tx
describe('browse stream', () => {
    it ('should browse session', async () => {
        const w = new Wallet()
        expect(w).toBeInstanceOf(Wallet)
        w.loadWallet(demo_wif)
        await w.loadUnspent()
        //console.log(w.selectedUtxos)
        const balance = w.balance
        //expect(balance).toBeGreaterThan(0)
        const packetsize = 250
        // consume the whole wallet
        const iterations = Math.ceil(balance/packetsize)
        let utxos!: OutputCollection
        let lastBuild = null
        console.log(`streaming ${iterations} money packets (${w.balance}/500)`)
        for( let x = 1; x <= iterations; x++) {
            console.log(`iteration ${x} of ${iterations}. ${utxos?.count} utxos`)
            const buildResult = await w.makeStreamableCashTx(
                Long.fromNumber(packetsize*x),
                null, //keyPair.toOutputScript(),
                true,
                utxos
            )
            utxos = buildResult.utxos
            lastBuild = buildResult
            //w.logDetailsLastTx()
            expect(buildResult.tx.txIns.length).toBeGreaterThan(0)
            // wallet should add utxos and not leave any dust outputs
            if (buildResult.tx.txOuts.length > 0) {
                expect (buildResult.tx.txOuts[0].valueBn.toNumber()).toBeGreaterThan(0)
            }
            if (x < iterations) {
                expect(w.getTxFund(buildResult.tx)).toBe(packetsize*x)
            }
        }
        if (lastBuild) {
            // should be no outputs. wallet is spent
            expect(lastBuild.tx.txOuts.length).toBe(0)
        }
    })

})