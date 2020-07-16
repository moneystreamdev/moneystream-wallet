"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bsv_1 = require("bsv");
var src_1 = require("../../src");
var TxPointer_1 = require("../../src/TxPointer");
var someHashBufString = '1aebb7d0776cec663cbbdd87f200bf15406adb0ef91916d102bcd7f86c86934e';
describe('unspentoutput tests', function () {
    it('should instantiate', function () {
        var utxo = new src_1.UnspentOutput(1111, bsv_1.Script.fromString(''));
        expect(utxo).toBeInstanceOf(src_1.UnspentOutput);
    });
    it('should create from txout', function () {
        var txout = bsv_1.TxOut.fromProperties(new bsv_1.Bn(1), bsv_1.Script.fromString(''));
        var unspent = src_1.UnspentOutput.fromTxOut(txout, someHashBufString, 99);
        expect(unspent).toBeDefined();
        expect(unspent.satoshis).toBe(1);
        expect(unspent.outputIndex).toBe(99);
        expect(unspent.txId).toBe(someHashBufString);
    });
    it('it should output as TxOut', function () {
        var utxo = new src_1.UnspentOutput(1111, bsv_1.Script.fromString(''));
        expect(utxo.toTxOut()).toBeInstanceOf(bsv_1.TxOut);
    });
    it('it should output as TxPointer', function () {
        var utxo = new src_1.UnspentOutput(1111, bsv_1.Script.fromString(''), '123', 99);
        expect(utxo.txPointer).toBeInstanceOf(TxPointer_1.TxPointer);
        expect(utxo.txPointer.toString()).toBe("123.99");
    });
    it('it should respond to session events', function () {
        var utxo = new src_1.UnspentOutput(1111, bsv_1.Script.fromString(''));
        expect(utxo.status).toBe('available');
        utxo.encumber();
        expect(utxo.status).toBe('hold');
        utxo.spend();
        expect(utxo.status).toBe('spent');
    });
});
//# sourceMappingURL=unspentoutput.test.js.map