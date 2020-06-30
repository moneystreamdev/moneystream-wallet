"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bsv_1 = require("bsv");
var src_1 = require("../../src");
describe('unspentoutput tests', function () {
    it('should instantiate', function () {
        var utxo = new src_1.UnspentOutput(1111, bsv_1.Script.fromString(''));
        expect(utxo).toBeInstanceOf(src_1.UnspentOutput);
    });
    it('it should output as TxOut', function () {
        var utxo = new src_1.UnspentOutput(1111, bsv_1.Script.fromString(''));
        expect(utxo.toTxOut()).toBeInstanceOf(bsv_1.TxOut);
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