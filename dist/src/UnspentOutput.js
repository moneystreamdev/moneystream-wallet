"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnspentOutput = void 0;
var bsv_1 = require("bsv");
var UnspentOutput = /** @class */ (function () {
    function UnspentOutput(satoshis, script, txid, txoutindex) {
        // txid is string but should be buf?
        this.txId = "";
        this.outputIndex = 0;
        this.script = script;
        this.satoshis = satoshis;
        this.txId = txid || "";
        this.outputIndex = txoutindex;
    }
    UnspentOutput.prototype.toTxOut = function () {
        return bsv_1.TxOut.fromProperties(new bsv_1.Bn(this.satoshis), this.script);
    };
    return UnspentOutput;
}());
exports.UnspentOutput = UnspentOutput;
//# sourceMappingURL=UnspentOutput.js.map