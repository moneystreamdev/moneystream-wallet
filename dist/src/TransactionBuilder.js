"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionBuilder = void 0;
var bsv_1 = require("bsv");
//constructs a transaction
var TransactionBuilder = /** @class */ (function () {
    function TransactionBuilder() {
        // build future transactions with locktime
        this.futureSeconds = 60;
        this.tx = new bsv_1.Transaction();
    }
    TransactionBuilder.prototype.inTheFuture = function (tx) {
        var nowTimeStampInSeconds = parseInt((Date.now() / 1000).toFixed(0));
        tx.nLockTime = nowTimeStampInSeconds + this.futureSeconds;
        return tx;
    };
    //for bsv2
    TransactionBuilder.prototype.setChangeAddress = function (address) {
    };
    TransactionBuilder.prototype.importPartiallySignedTx = function (tx) {
        this.tx = tx;
        //TODO: make sure tx can be signed!
        //TODO: verify that tx has input.output
        //verify inputs.input should be type PublicKeyHash
        // i.e. script.isPublicKeyHashOut()
    };
    //sighash not used until bsv2
    TransactionBuilder.prototype.addInput = function (utxo, sigHash) {
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
        // txb.inputFromPubKeyHash(
        //     //txHashBuf
        //     Buffer.from(this._utxo_tx_hash,'hex'), 
        //     //txOutNum
        //     this._utxo.outputIndex, 
        //     //txOut
        //     this._utxo,
        //     this._keypair.pubKey,
        //     //nSequence
        //     0xffffffff,
        //     Sig.SIGHASH_SINGLE 
        // )
        var txin = new bsv_1.Transaction.Input.PublicKeyHash({
            prevTxId: Buffer.from(utxo.txId, 'hex'),
            output: utxo,
            outputIndex: utxo.outputIndex,
            sequenceNumber: 0xffffffff,
            script: utxo.script
        });
        this.tx.addInput(txin);
    };
    TransactionBuilder.prototype.addOutput = function (amount, address) {
        //txb.outputToAddress(new Bn.Bn().fromNumber(changeAmount), this._address)
        this.tx.to(address, amount);
    };
    TransactionBuilder.prototype.build = function () {
        // txb.tx = new Tx.Tx()
        // const outAmountBn = txb.buildOutputs()
        // const inAmountBn = txb.buildInputs(outAmountBn, 0)
        // txb.sign([this._keypair])
    };
    TransactionBuilder.prototype.sign = function (keyPair, sigtype) {
        this.tx = this.inTheFuture(this.tx);
        this.tx.sign(keyPair, sigtype);
        return this.tx;
    };
    return TransactionBuilder;
}());
exports.TransactionBuilder = TransactionBuilder;
//# sourceMappingURL=TransactionBuilder.js.map