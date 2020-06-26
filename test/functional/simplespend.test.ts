import { Wallet } from '../../src/Wallet'
import * as Long from 'long'

describe('wallet broadcasts simple spend', () => {
    it ('should create transaction', async () => {
        const w = new Wallet()
        expect(w).toBeInstanceOf(Wallet)
        w.loadWallet('L5o1VbLNhELT6uCu8v7KdZpvVocHWnHBqaHe686ZkMkyszyU6D7n')
        const nftx = await w.makeAnyoneCanSpendTx(Long.fromNumber(100))
        expect(w.lastTx.txIns.length).toBe(1)
    })

    it('broadcasts', async () => {
        const sender = new Wallet()
        sender.loadWallet('L5o1VbLNhELT6uCu8v7KdZpvVocHWnHBqaHe686ZkMkyszyU6D7n')
        sender.logDetails()
        let sender_hex, sent
        sender_hex = await sender.makeAnyoneCanSpendTx(
            Long.fromNumber(500)
        )
        expect(sender.lastTx.txIns.length).toBe(1)
        sender.logDetailsLastTx()
        //console.log(sender.lastTx.toJSON())
        //console.log(sender_hex)
        // sent = await sender.broadcastRaw(sender_hex)
        // console.log(`broadcast Tx ${sent}`)
        // //result should be 32 byte hex
        // expect(sent.length).toBe(64)
    },10000)
})