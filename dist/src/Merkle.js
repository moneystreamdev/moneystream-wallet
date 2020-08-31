"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Merkle = void 0;
var merkletreejs_1 = require("merkletreejs");
var sha256_1 = __importDefault(require("crypto-js/sha256"));
// Handle hashing of data into merkle tree
var Merkle = /** @class */ (function () {
    function Merkle() {
    }
    // hash a json object
    Merkle.prototype.hash = function (json) {
        var flat = this.flattenToArray(json);
        var leaves = flat.map(function (x) { return sha256_1.default(x); });
        var tree = new merkletreejs_1.MerkleTree(leaves, sha256_1.default, { isBitcoinTree: true });
        return tree.getRoot();
    };
    Merkle.prototype.flattenToArray = function (json) {
        var _this = this;
        return Object.keys(json).reduce(function (acc, key) {
            acc.push(key);
            if (typeof json[key] === 'object') {
                acc = acc.concat(_this.flattenToArray(json[key]));
            }
            else {
                acc.push(json[key]);
            }
            return acc;
        }, []);
    };
    return Merkle;
}());
exports.Merkle = Merkle;
//# sourceMappingURL=Merkle.js.map