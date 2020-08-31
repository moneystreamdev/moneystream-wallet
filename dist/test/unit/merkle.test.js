"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Merkle_1 = require("../../src/Merkle");
var sessionContext = {
    "session": "abc-123",
    "txid": "deadbeef",
    "site": "bitcoinofthings.com"
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
            .toBe("feb1df76948fb65d42f6cf67224a8e36a7e471b7e14ffaedf02f6c0db598eaa4");
    });
});
//# sourceMappingURL=merkle.test.js.map