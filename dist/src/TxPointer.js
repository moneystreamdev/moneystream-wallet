"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TxPointer = void 0;
var TxPointer = /** @class */ (function () {
    function TxPointer(txhash, index) {
        this.txhash = txhash;
        this.index = index;
    }
    TxPointer.prototype.toString = function () {
        return this.txhash + "." + this.index;
    };
    return TxPointer;
}());
exports.TxPointer = TxPointer;
//# sourceMappingURL=TxPointer.js.map