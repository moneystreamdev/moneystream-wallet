import { Wallet } from '../../src/Wallet'
import { KeyPair } from '../../src/KeyPair'
import { OutputCollection } from '../../src/OutputCollection'
import { TxVerifier, TxOutMap } from 'bsv'
import * as Long from 'long'

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
        const iterations = Math.floor((w.balance-546)/packetsize)
        let utxos!:OutputCollection
        console.log(`streaming ${iterations} money packets`)
        for( let x = 1; x <= iterations; x++) {
            const buildResult = await w.makeStreamableCashTx(
                Long.fromNumber(packetsize*x),
                null, //keyPair.toOutputScript(),
                true,
                utxos
            )
            utxos = buildResult.utxos
            expect(buildResult.tx.txIns.length).toBeGreaterThan(0)
            expect(w.getTxFund(buildResult.tx)).toBe(packetsize*x)
            //w.logDetailsLastTx()
            console.log(buildResult.hex)
            //console.log(buildResult)
            // const verifier = new TxVerifier(buildResult.tx, buildResult.txOutMap)
            // expect(verifier).toBeDefined()
            // const verifyResult = verifier.verify(0)
            // console.log(verifier.errStr)
            // expect(verifyResult).toBeTruthy()
        }
        w.logDetailsLastTx()
        expect(w.fundingInputCount).toBe(2)
    })
})