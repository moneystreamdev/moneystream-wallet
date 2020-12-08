"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Wallet_1 = require("../../src/Wallet");
var FileSystemStorage_1 = __importDefault(require("../../src/FileSystemStorage"));
// const demo_wif = 'Kyy7baVyD24NHQVJZrap3s5CvaLPUvFfEQ74eYwsBigbjEJu3HBg'
describe('real wallet works with WOC', function () {
    it('should create transaction', function () {
        var w = new Wallet_1.Wallet(new FileSystemStorage_1.default());
        expect(w).toBeInstanceOf(Wallet_1.Wallet);
    });
    //     it ('should load wallet balance', async () => {
    //         const w = new Wallet(new FileSystemStorage())
    //         expect(w).toBeInstanceOf(Wallet)
    //         w.loadWallet(demo_wif)
    //         const utxos = await w.loadUnspent()
    //         expect(utxos.count).toBeGreaterThan(0)
    //         w.logUtxos(utxos.items)
    //         const firstbalance = w.balance
    //         expect(firstbalance).toBeGreaterThan(0)
    //         const refreshUtxos = await w.loadUnspent()
    //         expect (w.balance).toBe(firstbalance)
    //         expect(refreshUtxos.count).toBe(utxos.count)
    //         console.log(w.balance)
    //     })
});
//# sourceMappingURL=walletindex.test.js.map