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
    }
    Object.defineProperty(TransactionBuilder.prototype, "tx", {
        get: function () { return this.txb.tx; },
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
            this.addInput(utxo, pubKey, sigHash);
        }
        return this;
    };
    TransactionBuilder.prototype.toAddress = function (satoshis, address) {
        this.addOutput(satoshis, address);
        return this;
    };
    TransactionBuilder.prototype.change = function (address) {
        this.txb.setChangeAddress(address);
        return this;
    };
    //sighash not used until bsv2
    TransactionBuilder.prototype.addInput = function (utxo, pubKey, sigHash) {
        //spend utxo as input, first 3 param required
        //inputFromPubKeyHash (txHashBuf, txOutNum, txOut, pubKey, nSequence, nHashType)
        // txhashbuf is tx hash/id as 32 byte buffer (tx_hash)
        // txoutnum is index of output (tx_pos)
        // txout is TxOut created from amount and script 
        // i.e. const txOut1 = TxOut.fromProperties(new Bn(1e8), scriptout1)
        // i.e. value + output script
        // for now, output script is our address
        // later have to do in more sophisticated way
        // pubKeyHash out
        this.txb.inputFromPubKeyHash(
        //txHashBuf
        Buffer.from(utxo.txId, 'hex'), 
        //txOutNum
        utxo.outputIndex, 
        //     //txOut
        utxo.toTxOut(), pubKey
        //nSequence
        //     0xffffffff,
        //     Sig.SIGHASH_SINGLE 
        );
        // const txin = new TxIn(
        //     Buffer.from(utxo.txId,'hex'),
        //     utxo.outputIndex,
        //     utxo.script,
        //     this.FINAL
        // )
        //     {
        //     prevTxId:Buffer.from(utxo.txId,'hex'),
        //     output:utxo,
        //     outputIndex: utxo.outputIndex,
        //     sequenceNumber: 0xffffffff,
        //     script: utxo.script
        // })
        //this.tx.addInput(txin)
        return this.txb.txIns.length;
    };
    TransactionBuilder.prototype.addOutput = function (satoshis, address) {
        this.txb.outputToAddress(new bsv_1.Bn().fromNumber(satoshis), address);
        //this.txb.to(address, amount)
    };
    TransactionBuilder.prototype.buildAndSign = function (keypair, makeFuture) {
        // txb.build too restrictive!
        // i.e. "cannot create output lesser than dust"
        //this.txb.build()
        this.txb.tx = new bsv_1.Tx();
        var outAmountBn = this.txb.buildOutputs();
        var inAmountBn = this.txb.buildInputs(outAmountBn, 1);
        this.sign(keypair, makeFuture);
        return this.txb.tx;
    };
    //sigtype should be passed in to each input
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