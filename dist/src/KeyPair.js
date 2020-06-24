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
        return bsv_1.Address.fromPubKey(this.pubKey, 'livenet');
    };
    //pay to pub key hash of address
    KeyPair.prototype.toOutputScript = function () {
        return this.toAddress().toTxOutScript();
    };
    KeyPair.prototype.fromRandom = function () {
        var privKey = bsv_1.PrivKey.fromRandom();
        return this.fromPrivKey(privKey);
    };
    KeyPair.prototype.fromPrivKey = function (privKey) {
        this.privKey = privKey;
        this.pubKey = bsv_1.PubKey.fromPrivKey(privKey);
        return this;
    };
    KeyPair.prototype.fromWif = function (wif) {
        var privKey = bsv_1.PrivKey.fromWif(wif);
        return this.fromPrivKey(privKey);
    };
    KeyPair.prototype.toWif = function () {
        return this.privKey.toWif();
    };
    KeyPair.prototype.toXpub = function () {
        return this.pubKey.toString();
    };
    return KeyPair;
}());
exports.KeyPair = KeyPair;
//# sourceMappingURL=KeyPair.js.map