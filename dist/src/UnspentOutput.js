"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnspentOutput = void 0;
var bsv_1 = require("bsv");
var TxPointer_1 = require("./TxPointer");
var UnspentOutput = /** @class */ (function () {
    function UnspentOutput(satoshis, script, txid, txoutindex, status, walletId) {
        this._status = "available";
        // txid is string but should be buf?
        this.txId = "";
        this.outputIndex = 0;
        this.walletId = "";
        this.script = script;
        this.satoshis = satoshis;
        this.amountSpent = 0;
        if (txid && txid.length != 64) {
            throw new Error("Invalid TxId " + txid);
        }
        this.txId = txid || "";
        this.outputIndex = txoutindex;
        this._status = status || 'available';
        this.walletId = walletId || "";
    }
    Object.defineProperty(UnspentOutput.prototype, "status", {
        get: function () { return this._status; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UnspentOutput.prototype, "txPointer", {
        get: function () { return new TxPointer_1.TxPointer(this.txId, this.outputIndex); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UnspentOutput.prototype, "balance", {
        // current balance available to spend on this output
        get: function () {
            if (this.status == 'spent')
                return 0;
            return this.satoshis - this.amountSpent;
        },
        enumerable: false,
        configurable: true
    });
    UnspentOutput.fromTxOut = function (txOut, txid, txoutindex) {
        var output = new UnspentOutput(txOut.valueBn.toNumber(), txOut.script);
        output.txId = txid;
        output.outputIndex = txoutindex;
        return output;
    };
    UnspentOutput.prototype.toTxOut = function () {
        return bsv_1.TxOut.fromProperties(new bsv_1.Bn(this.satoshis), this.script);
    };
    // encumber this utxo in a session
    // utxo can only be encumbered in one session
    // at a time
    UnspentOutput.prototype.encumber = function () {
        this._status = "hold";
    };
    UnspentOutput.prototype.unencumber = function () {
        this._status = "available";
    };
    // mark this utxo when it is finally spent
    // at end of session
    UnspentOutput.prototype.spend = function () {
        this._status = "spent";
    };
    return UnspentOutput;
}());
exports.UnspentOutput = UnspentOutput;
//# sourceMappingURL=UnspentOutput.js.map