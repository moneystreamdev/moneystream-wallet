"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//these can only be run when bsv2
// is installed in node_modules
var KeyPair_1 = require("../../src/KeyPair");
var bsv_1 = require("bsv");
describe('Instantiate KeyPair', function () {
    it('should instantiate a keypair object', function () {
        var k = new KeyPair_1.KeyPair();
        expect(k).toBeInstanceOf(KeyPair_1.KeyPair);
    });
    it('should generate random keypair', function () {
        var k = new KeyPair_1.KeyPair().fromRandom();
        expect(k).toBeInstanceOf(KeyPair_1.KeyPair);
        expect(k.privKey).toBeInstanceOf(bsv_1.PrivateKey);
        expect(k.pubKey).toBeInstanceOf(bsv_1.PublicKey);
    });
    it('should generate keypair from wif', function () {
        var k = new KeyPair_1.KeyPair().fromRandom();
        var wif = k.toWif();
        var k2 = new KeyPair_1.KeyPair().fromWif(wif);
        expect(k2.toWif()).toBe(wif);
    });
});
//# sourceMappingURL=keypair.test.js.map