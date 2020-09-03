"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Merkle_1 = require("../../src/Merkle");
var sessionContext = {
    "session": "abc-123",
    "txid": "deadbeef",
    "site": "bitcoinofthings.com",
    "amount": 0
};
describe('Merkle tests', function () {
    it('should flatten simple', function () {
        var m = new Merkle_1.Merkle();
        var flat = m.flattenToArray({ 'a': 'b', 'c': 'd' });
        expect(flat).toBeInstanceOf(Array);
        expect(flat.length).toBe(4);
        expect(flat[0]).toBe('a');
        expect(flat[1]).toBe('b');
        expect(flat[2]).toBe('c');
        expect(flat[3]).toBe('d');
    });
    it('should flatten nested', function () {
        var m = new Merkle_1.Merkle();
        var flat = m.flattenToArray({ 'a': { 'b': 'c' } });
        expect(flat).toBeInstanceOf(Array);
        expect(flat.length).toBe(3);
        expect(flat[0]).toBe('a');
        expect(flat[1]).toBe('b');
        expect(flat[2]).toBe('c');
    });
    it('should merkle json', function () {
        var m = new Merkle_1.Merkle();
        var h = m.hash(sessionContext);
        expect(h).toBeInstanceOf(Buffer);
        expect(h.toString('hex'))
            .toBe("ecb02ef91479fd8ef0ef7f3c83ce2642bdd2341dbdd846d5c6a061157eddbf0a");
        sessionContext.amount = 99;
        var h2 = m.hash(sessionContext);
        expect(h.toString()).not.toBe(h2.toString());
    });
});
//# sourceMappingURL=merkle.test.js.map