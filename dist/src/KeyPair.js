"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyPair = void 0;
var bsv_1 = require("bsv");
// a public and private pair of keys
var KeyPair = /** @class */ (function () {
    function KeyPair(privKey, pubKey) {
        this.privKey = privKey;
        this.pubKey = pubKey;
    }
    KeyPair.prototype.toAddress = function () {
        return bsv_1.Address.fromPublicKey(this.pubKey, 'livenet');
    };
    //pay to pub key hash of address
    KeyPair.prototype.toScript = function () {
        return bsv_1.Script.buildPublicKeyHashOut(this.toAddress());
    };
    KeyPair.prototype.fromRandom = function () {
        var privKey = bsv_1.PrivateKey.fromRandom();
        return this.fromPrivKey(privKey);
    };
    KeyPair.prototype.fromPrivKey = function (privKey) {
        this.privKey = privKey;
        this.pubKey = bsv_1.PublicKey.fromPrivateKey(privKey);
        return this;
    };
    KeyPair.prototype.fromWif = function (wif) {
        var privKey = bsv_1.PrivateKey.fromWIF(wif);
        return this.fromPrivKey(privKey);
    };
    KeyPair.prototype.toWif = function () {
        return this.privKey.toWIF();
    };
    KeyPair.prototype.toXpub = function () {
        return this.pubKey.toString();
    };
    return KeyPair;
}());
exports.KeyPair = KeyPair;
//# sourceMappingURL=KeyPair.js.map