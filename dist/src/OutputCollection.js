"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputCollection = void 0;
var UnspentOutput_1 = require("./UnspentOutput");
//a list of transaction outputs
var OutputCollection = /** @class */ (function () {
    function OutputCollection(outputs) {
        this._outs = [];
        if (outputs)
            this._outs = outputs;
    }
    Object.defineProperty(OutputCollection.prototype, "items", {
        get: function () { return this._outs; },
        enumerable: false,
        configurable: true
    });
    OutputCollection.prototype.hasAny = function () {
        return this._outs.length > 0;
    };
    OutputCollection.prototype.add = function (output) {
        this._outs.push(output);
    };
    OutputCollection.prototype.count = function () { return this._outs.length; };
    Object.defineProperty(OutputCollection.prototype, "lastItem", {
        get: function () { return this._outs[this.count() - 1]; },
        enumerable: false,
        configurable: true
    });
    OutputCollection.prototype.satoshis = function () {
        if (this._outs.length === 0)
            return 0;
        var sum = 0;
        //return this._outs.reduce( (a:any,b:any) => a + b.satoshis )
        for (var i = 0; i < this._outs.length; i++) {
            sum += this._outs[i].satoshis;
        }
        return sum;
    };
    OutputCollection.prototype.find = function (txHashBuf, txOutNum) {
        for (var i = 0; i < this._outs.length; i++) {
            var thisOut = this._outs[i];
            if (thisOut.outputIndex === txOutNum
                && thisOut.txId === txHashBuf.toString('hex')) {
                return thisOut;
            }
        }
        return null;
    };
    OutputCollection.prototype.filter = function (satoshis) {
        //sort by satoshis descending
        //TODO: put non-confirmed at bottom, else track encumbered
        this._outs.sort(function (a, b) { return b.satoshis - a.satoshis; });
        var amountremaining = satoshis.toNumber();
        //keep adding outputs until we can cover the amount
        var result = new OutputCollection();
        for (var i = 0; i < this._outs.length; i++) {
            var utxo = this._outs[i];
            result.add(utxo);
            amountremaining -= utxo.satoshis;
            if (amountremaining < 0)
                break;
        }
        return result;
    };
    // return a OutputCollection for wallet to
    // operate upon
    OutputCollection.prototype.split = function (targetCount, satoshis) {
        this._outs.sort(function (a, b) { return b.satoshis - a.satoshis; });
        var result = {
            utxo: new UnspentOutput_1.UnspentOutput(0, ''),
            breakdown: new OutputCollection()
        };
        //find largest one
        if (this.count() > 0) {
            var largest = this._outs[0];
            var actualBreak = satoshis;
            if (largest.satoshis > satoshis) {
                var desiredBreak = largest.satoshis / targetCount;
                if (desiredBreak > satoshis) {
                    actualBreak = desiredBreak;
                }
            }
            result.utxo = largest;
            var remaining = actualBreak * targetCount;
            while (remaining > 0) {
                result.breakdown.add(new UnspentOutput_1.UnspentOutput(actualBreak, largest.script));
                remaining -= actualBreak;
            }
            if (result.breakdown.count() > 0) {
                result.breakdown.lastItem.satoshis += remaining;
            }
        }
        return result;
    };
    return OutputCollection;
}());
exports.OutputCollection = OutputCollection;
//# sourceMappingURL=OutputCollection.js.map