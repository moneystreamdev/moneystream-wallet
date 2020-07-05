"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var src_1 = require("../../src");
var testutils_1 = require("../util/testutils");
describe('transactionbuilder tests', function () {
    it('instantiates transactionbuilder', function () {
        var txb = new src_1.TransactionBuilder();
        expect(txb).toBeInstanceOf(src_1.TransactionBuilder);
    });
    it('rejects duplicate inputs', function () {
        var txb = new src_1.TransactionBuilder();
        var utxos = testutils_1.createUtxos(1, 1000);
        txb.addInput(utxos.firstItem, testutils_1.testKeyPair.pubKey);
        expect(txb.txb.txIns.length).toBe(1);
        expect(utxos.firstItem.status).toBe('hold');
        expect(txb.hasInput(utxos.firstItem)).toBe(true);
        //duplicate input should fail
        expect(function () {
            txb.addInput(utxos.firstItem, testutils_1.testKeyPair.pubKey);
        }).toThrow(Error);
    });
});
//# sourceMappingURL=transactionbuilder.test.js.map