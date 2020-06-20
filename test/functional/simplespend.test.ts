import { Wallet } from '../../src/Wallet'
import * as Long from 'long'

describe('wallet broadcasts simple spend', () => {
    it ('should load wallet', async () => {
        const w = new Wallet()
        expect(w).toBeInstanceOf(Wallet)
        w.loadWallet('L5o1VbLNhELT6uCu8v7KdZpvVocHWnHBqaHe686ZkMkyszyU6D7n')
        const nftx = await w.makeAnyoneCanSpendTx(Long.fromNumber(100))
        console.log(w.lastTx.toJSON())
        expect(w.lastTx.inputs[0].output.satoshis).toBeGreaterThan(800)

    })

    // it('broadcasts', async () => {
    //     const sender = new Wallet()
    //     sender.loadWallet('L5o1VbLNhELT6uCu8v7KdZpvVocHWnHBqaHe686ZkMkyszyU6D7n')
    //     sender.logDetails()
    //     let sender_hex, sent
    //     sender_hex = await sender.makeAnyoneCanSpendTx(
    //         Long.fromNumber(600)
    //     )
    //     //TODO: might not be 1 if multiple utxo combined
    //     expect(sender.lastTx.inputs.length).toBe(1)
    //     console.log(sender_hex)
    //     console.log(sender.logDetails(sender.lastTx))
    //     // sent = await sender.broadcastRaw(sender_hex)
    //     // console.log(`broadcast Tx ${sent}`)
    //     // //result should be 32 byte hex
    //     // expect(sent.length).toBe(32)
    // },10000)
})