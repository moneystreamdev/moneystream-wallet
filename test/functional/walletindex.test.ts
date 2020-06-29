import { Wallet } from '../../src/Wallet'
import * as Long from 'long'

describe('real wallet works with WOC', () => {
    it ('should load wallet balance', async () => {
        const w = new Wallet()
        expect(w).toBeInstanceOf(Wallet)
        w.loadWallet('L5o1VbLNhELT6uCu8v7KdZpvVocHWnHBqaHe686ZkMkyszyU6D7n')
        await w.loadUnspent()
        expect(w.balance).toBeGreaterThan(0)
        console.log(w.balance)
    })
})
