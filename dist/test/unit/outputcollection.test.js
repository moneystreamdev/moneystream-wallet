"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var OutputCollection_1 = require("../../src/OutputCollection");
var src_1 = require("../../src");
var Long = __importStar(require("long"));
var someHashBufString = '1aebb7d0776cec663cbbdd87f200bf15406adb0ef91916d102bcd7f86c86934e';
function createUtxos(count, satoshis) {
    var lotsOfUtxos = new OutputCollection_1.OutputCollection();
    for (var index = 0; index < count; index++) {
        var testUtxo = new src_1.UnspentOutput(satoshis, new src_1.KeyPair().fromRandom().toOutputScript(), someHashBufString, index);
        lotsOfUtxos.add(testUtxo);
    }
    return lotsOfUtxos;
}
describe('output collection tests', function () {
    it('should instantiate', function () {
        var utxos = new OutputCollection_1.OutputCollection();
        expect(utxos).toBeInstanceOf(OutputCollection_1.OutputCollection);
        expect(utxos.hasAny()).toBeFalsy();
    });
    it('should set walletid', function () {
        var unspents = [];
        var utxos = new OutputCollection_1.OutputCollection(unspents, 'somewallet');
        expect(utxos).toBeInstanceOf(OutputCollection_1.OutputCollection);
        expect(utxos.hasAny()).toBeFalsy();
        console.log(utxos);
        expect(utxos.walletId).toBe('somewallet');
    });
    it('should break up a utxo', function () {
        var utxos = new OutputCollection_1.OutputCollection();
        utxos.add(new src_1.UnspentOutput(10000, ''));
        var splits = utxos.split(10, 1000);
        expect(splits.breakdown.count).toBe(10);
    });
    it('should not break up an empty utxo', function () {
        var utxos = new OutputCollection_1.OutputCollection();
        var splits = utxos.split(10, 1000);
        expect(splits.breakdown.count).toBe(0);
    });
    it('should filter outputs', function () {
        var utxos = createUtxos(10, 1);
        expect(utxos.count).toBe(10);
        var filtered = utxos.filter(Long.fromNumber(8));
        expect(filtered.count).toBe(8);
    });
    it('should filter outputs', function () {
        var utxos = createUtxos(258, 1000);
        expect(utxos.count).toBe(258);
        var filtered = utxos.filter(Long.fromNumber(257 * 1000));
        expect(filtered.count).toBe(257);
    });
    it('should get spendable outputs', function () {
        var utxos = createUtxos(10, 1);
        expect(utxos.spendable().count).toBe(10);
        expect(utxos.encumbered().count).toBe(0);
        expect(utxos.spent().count).toBe(0);
        utxos.firstItem.spend();
        expect(utxos.spendable().count).toBe(9);
        expect(utxos.encumbered().count).toBe(0);
        expect(utxos.spent().count).toBe(1);
        utxos.lastItem.spend();
        expect(utxos.spendable().count).toBe(8);
        expect(utxos.encumbered().count).toBe(0);
        expect(utxos.spent().count).toBe(2);
        utxos.firstItem.encumber();
        expect(utxos.spendable().count).toBe(8);
        expect(utxos.encumbered().count).toBe(1);
        expect(utxos.spent().count).toBe(1);
        utxos.lastItem.encumber();
        expect(utxos.spendable().count).toBe(8);
        expect(utxos.encumbered().count).toBe(2);
        expect(utxos.spent().count).toBe(0);
    });
    it('should get output to json', function () {
        var utxos = createUtxos(2, 1);
        expect(utxos.count).toBe(2);
        utxos.firstItem.encumber();
        var sx = JSON.stringify(utxos);
        var rehydrate = OutputCollection_1.OutputCollection.fromJSON(JSON.parse(sx));
        expect(rehydrate).toBeInstanceOf(OutputCollection_1.OutputCollection);
        expect(rehydrate.count).toBe(2);
        expect(rehydrate.spendable().count).toBe(1);
        expect(rehydrate.spendable().satoshis).toBe(1);
    });
    it('should not add duplicate outputs', function () {
        var outputs = new OutputCollection_1.OutputCollection();
        var txout = new src_1.UnspentOutput(1, null, someHashBufString, 99);
        outputs.add_conditional(txout);
        expect(outputs.count).toBe(1);
        outputs.add_conditional(txout);
        expect(outputs.count).toBe(1);
    });
    it('should find by attribute', function () {
        var outputs = new OutputCollection_1.OutputCollection();
        var txout = new src_1.UnspentOutput(1, null, someHashBufString, 99);
        outputs.add_conditional(txout);
        expect(outputs.count).toBe(1);
        var txfound = outputs.find(Buffer.from(someHashBufString, 'hex'), 99);
        expect(txfound).toBeDefined();
        expect(txfound === null || txfound === void 0 ? void 0 : txfound.txId).toBe(txout.txId);
    });
    it('should find by txout', function () {
        var outputs = new OutputCollection_1.OutputCollection();
        var txout = new src_1.UnspentOutput(1, null, someHashBufString, 99);
        outputs.add_conditional(txout);
        expect(outputs.count).toBe(1);
        var txfound = outputs.findTxOut(txout);
        expect(txfound).toBeDefined();
        expect(txfound === null || txfound === void 0 ? void 0 : txfound.txId).toBe(txout.txId);
    });
    it('should get largest unspent', function () {
        var utxos1 = createUtxos(1, 1);
        expect(utxos1.count).toBe(1);
        var utxos2 = createUtxos(1, 2);
        expect(utxos2.count).toBe(1);
        var utxos3 = createUtxos(1, 3);
        expect(utxos3.count).toBe(1);
        var combined = utxos1;
        combined.add(utxos2.firstItem);
        combined.add(utxos3.firstItem);
        expect(combined.count).toBe(3);
        expect(combined.firstItem.satoshis).toBe(1);
        expect(combined.largestItem.satoshis).toBe(3);
        // largest resorts
        expect(combined.firstItem.satoshis).toBe(3);
    });
    it('should get smallest unspent', function () {
        var utxos1 = createUtxos(1, 1);
        expect(utxos1.count).toBe(1);
        var utxos2 = createUtxos(1, 2);
        expect(utxos2.count).toBe(1);
        var utxos3 = createUtxos(1, 3);
        expect(utxos3.count).toBe(1);
        var combined = utxos3;
        combined.add(utxos2.firstItem);
        combined.add(utxos1.firstItem);
        expect(combined.count).toBe(3);
        expect(combined.firstItem.satoshis).toBe(3);
        expect(combined.smallestItem.satoshis).toBe(1);
        expect(combined.firstItem.satoshis).toBe(3);
    });
});
//# sourceMappingURL=outputcollection.test.js.map