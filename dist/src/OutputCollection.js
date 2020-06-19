"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputCollection = void 0;
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
    OutputCollection.prototype.filter = function (satoshis) {
        //sort by satoshis descending
        //TODO: put non-confirmed at bottom!
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
    return OutputCollection;
}());
exports.OutputCollection = OutputCollection;
//# sourceMappingURL=OutputCollection.js.map