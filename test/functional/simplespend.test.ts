import { Wallet } from '../../src/Wallet'
import { OutputCollection } from '../../src/OutputCollection'
import * as Long from 'long'

const demo_wif = 'L5bxi2ef2R8LuTvQbGwkY9w6KJzpPckqRQMnjtD8D2EFqjGeJnSq'
//const demo_wif = 'L5o1VbLNhELT6uCu8v7KdZpvVocHWnHBqaHe686ZkMkyszyU6D7n'

describe('wallet broadcasts simple spend', () => {
    it ('should create transaction', () => {
        const w = new Wallet()
        expect(w).toBeInstanceOf(Wallet)
    })
//     it ('should create transaction', async () => {
//         const w = new Wallet()
//         expect(w).toBeInstanceOf(Wallet)
//         w.loadWallet(demo_wif)
//         const buildResult = await w.makeStreamableCashTx(Long.fromNumber(100))
//         expect(w.lastTx.txIns.length).toBe(1)
//         expect(buildResult.utxos.firstItem.satoshis).toBeGreaterThan(0)
//     })

//     it('broadcasts', async () => {
//         const sender = new Wallet()
//         sender.loadWallet(demo_wif)
//         //sender.logDetails()
//         let sent
//         const buildResult = await sender.makeStreamableCashTx(
//             Long.fromNumber(500)
//         )
//         expect(sender.lastTx.txIns.length).toBe(1)
//         sender.logDetailsLastTx()
//         expect(buildResult.utxos.firstItem.satoshis).toBeGreaterThan(0)
//         //console.log(sender.lastTx.toJSON())
//         //console.log(sender_hex)
//         // sent = await sender.broadcastRaw(sender_hex)
//         // console.log(`broadcast Tx ${sent}`)
//         // //result should be 32 byte hex
//         // expect(sent.length).toBe(64)
//     },10000)

})