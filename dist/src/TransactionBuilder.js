"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionBuilder = void 0;
var bsv_1 = require("bsv");
//constructs a transaction
var TransactionBuilder = /** @class */ (function () {
    function TransactionBuilder() {
        // our builder is wrapper around bsv.TxBuilder
        this.txb = new bsv_1.TxBuilder();
        // build future transactions with locktime
        this.futureSeconds = 60;
        this.FINAL = 0xffffffff;
        //allow any dust output
        // let web site manage dust policy
        this.txb.setDust(0);
    }
    Object.defineProperty(TransactionBuilder.prototype, "tx", {
        get: function () { return this.txb.tx; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TransactionBuilder.prototype, "miningFee", {
        get: function () {
            return this.inputAmountBuilt - this.outputAmountBuilt;
        },
        enumerable: false,
        configurable: true
    });
    TransactionBuilder.prototype.inTheFuture = function (tx) {
        var nowTimeStampInSeconds = parseInt((Date.now() / 1000).toFixed(0));
        tx.nLockTime = nowTimeStampInSeconds + this.futureSeconds;
        return tx;
    };
    //for bsv2
    TransactionBuilder.prototype.setChangeAddress = function (address) {
    };
    TransactionBuilder.prototype.importPartiallySignedTx = function (tx) {
        this.txb = new bsv_1.TxBuilder().importPartiallySignedTx(tx);
        //TODO: make sure tx can be signed!
        //TODO: verify that tx has input.output
        //verify inputs.input should be type PublicKeyHash
        // i.e. script.isPublicKeyHashOut()
    };
    TransactionBuilder.prototype.from = function (utxos, pubKey, sigHash) {
        for (var index = 0; index < utxos.length; index++) {
            var utxo = utxos[index];
            if (utxo.isSpendable) {
                this.addInput(utxo, pubKey, sigHash);
            }
        }
        return this;
    };
    TransactionBuilder.prototype.toAddress = function (satoshis, address) {
        this.addOutputAddress(satoshis, address);
        return this;
    };
    TransactionBuilder.prototype.change = function (address) {
        this.txb.setChangeAddress(address);
        return this;
    };
    TransactionBuilder.prototype.hasInput = function (utxo) {
        for (var index = 0; index < this.txb.txIns.length; index++) {
            var txin = this.txb.txIns[index];
            if (txin.txHashBuf.toString('hex') === utxo.txId
                && txin.txOutNum === utxo.outputIndex) {
                return true;
            }
        }
        return false;
    };
    // spend a utxo
    // pubkey is the address it was spent from
    // sighash is the signing method for the input
    TransactionBuilder.prototype.addInput = function (utxo, pubKey, sigHash) {
        //raise an error if this would be a duplicate input
        if (this.hasInput(utxo)) {
            throw new Error("duplicate input " + utxo.txPointer.toString());
        }
        // make sure this utxo will not get chosen in another session
        utxo.encumber();
        //spend utxo as input, first 3 param required
        this.txb.inputFromPubKeyHash(
        //txHashBuf
        Buffer.from(utxo.txId, 'hex'), 
        //txOutNum
        utxo.outputIndex, 
        //txOut
        utxo.toTxOut(), pubKey, this.FINAL, sigHash);
        //return the new length of inputs
        return this.txb.txIns.length;
    };
    TransactionBuilder.prototype.addOutputScript = function (satoshis, script) {
        if (typeof script === "string") {
            script = new bsv_1.Script().fromString(script);
        }
        this.txb.outputToScript(new bsv_1.Bn().fromNumber(satoshis), script);
    };
    TransactionBuilder.prototype.addOutputAddress = function (satoshis, address) {
        this.txb.outputToAddress(new bsv_1.Bn().fromNumber(satoshis), address);
    };
    //TODO: might be able to use txbuilder?
    TransactionBuilder.prototype.buildAndSign = function (keypair, makeFuture) {
        this.txb.tx = new bsv_1.Tx();
        this.outputAmountBuilt = this.txb.buildOutputs();
        //use all inputs so that user can spend dust if they want
        var extraInputsNum = this.txb.txIns.length - 1;
        this.inputAmountBuilt = this.txb.buildInputs(this.outputAmountBuilt, extraInputsNum);
        this.sign(keypair, makeFuture);
        return this.txb.tx;
    };
    //sigtype was passed in to each input
    TransactionBuilder.prototype.sign = function (keyPair, makeFuture) {
        if (makeFuture) {
            //make the tx in the future
            this.txb.tx = this.inTheFuture(this.txb.tx);
        }
        this.txb.signWithKeyPairs([keyPair]);
        return this.txb.tx;
    };
    return TransactionBuilder;
}());
exports.TransactionBuilder = TransactionBuilder;
//# sourceMappingURL=TransactionBuilder.js.map