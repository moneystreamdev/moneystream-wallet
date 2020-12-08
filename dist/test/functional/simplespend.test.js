"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Wallet_1 = require("../../src/Wallet");
var FileSystemStorage_1 = __importDefault(require("../../src/FileSystemStorage"));
var demo_wif = 'L5bxi2ef2R8LuTvQbGwkY9w6KJzpPckqRQMnjtD8D2EFqjGeJnSq';
//const demo_wif = 'L5o1VbLNhELT6uCu8v7KdZpvVocHWnHBqaHe686ZkMkyszyU6D7n'
describe('wallet broadcasts simple spend', function () {
    it('should create transaction', function () {
        var w = new Wallet_1.Wallet(new FileSystemStorage_1.default());
        expect(w).toBeInstanceOf(Wallet_1.Wallet);
    });
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
});
//# sourceMappingURL=simplespend.test.js.map