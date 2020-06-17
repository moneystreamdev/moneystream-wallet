import {Transaction} from 'bsv'

//constructs a transaction
export default class TransactionBuilder {
    // the transaction we are building
    tx:any
    // build future transactions with locktime
    futureSeconds:number = 60
    constructor() {
        this.tx = new Transaction()
    }

    inTheFuture(tx:any):any {
        let nowTimeStampInSeconds 
            = parseInt((Date.now()/1000).toFixed(0))
        tx.nLockTime = nowTimeStampInSeconds + this.futureSeconds
        return tx
    }

    //for bsv2
    setChangeAddress(address:any) {
    }

    importPartiallySignedTx(tx:any) {
        this.tx = tx
        //TODO: make sure tx can be signed!
        //TODO: verify that tx has input.output
        //verify inputs.input should be type PublicKeyHash
        // i.e. script.isPublicKeyHashOut()
    }

    //sighash not used until bsv2
    addInput(utxo:any, sigHash:any) {
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
        const txin = new Transaction.Input.PublicKeyHash({
            prevTxId:Buffer.from(utxo.txId,'hex'),
            output:utxo,
            outputIndex: utxo.outputIndex,
            sequenceNumber: 0xffffffff,
            script: utxo.script
        })
        this.tx.addInput(txin)
    }

    addOutput(amount:number, address:any) {
        //txb.outputToAddress(new Bn.Bn().fromNumber(changeAmount), this._address)
        this.tx.to(address, amount)
    }

    build() { /* bsv2 */ 
        // txb.tx = new Tx.Tx()
        // const outAmountBn = txb.buildOutputs()
        // const inAmountBn = txb.buildInputs(outAmountBn, 0)
        // txb.sign([this._keypair])
    }

    sign(keyPair:any, sigtype:any) {
        this.tx = this.inTheFuture(this.tx)
        this.tx.sign(keyPair, sigtype)
        return this.tx
    }
}
