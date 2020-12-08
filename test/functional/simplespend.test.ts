import { Wallet } from '../../src/Wallet'
import FileSystemStorage from '../../src/FileSystemStorage'
import { OutputCollection } from '../../src/OutputCollection'
import * as Long from 'long'
import { Address } from 'bsv'

const demo_wif = 'L5bxi2ef2R8LuTvQbGwkY9w6KJzpPckqRQMnjtD8D2EFqjGeJnSq'
//const demo_wif = 'L5o1VbLNhELT6uCu8v7KdZpvVocHWnHBqaHe686ZkMkyszyU6D7n'

describe('wallet broadcasts simple spend', () => {
    it ('should create transaction', () => {
        const w = new Wallet(new FileSystemStorage())
        expect(w).toBeInstanceOf(Wallet)
    })
    // it ('should create transaction', async () => {
    //     const w = new Wallet(new FileSystemStorage())
    //     expect(w).toBeInstanceOf(Wallet)
    //     w.loadWallet(demo_wif)
    //     const utxos = await w.loadUnspent()
    //     utxos?.firstItem?.encumber()
    //     const buildResult = await w.makeStreamableCashTx(
    //         Long.fromNumber(44444),
    //         new Address().fromString('133hMAzFDT4R8KRUqoQggv1UvcuyePzRn5').toTxOutScript(),
    //         true,
    //         utxos
    //     )
    //     console.log(buildResult)
    //     w.logDetailsLastTx()
    //     expect(w.lastTx.txIns.length).toBe(1)
    //     expect(buildResult.utxos.firstItem.satoshis).toBeGreaterThan(0)
    // })

//     it('broadcasts', async () => {
//         const sender = new Wallet(new FileSystemStorage())
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