import { Bn, TxBuilder, Tx, TxIn } from 'bsv'
import { KeyPair } from './KeyPair'
import { UnspentOutput } from './UnspentOutput'

//constructs a transaction
export class TransactionBuilder {
    // our builder is wrapper around bsv.TxBuilder
    txb: any = new TxBuilder()
    // build future transactions with locktime
    futureSeconds:number = 60
    private FINAL = 0xffffffff
    constructor() {
    }

    get tx (): any { return this.txb.tx}

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
        this.txb = new TxBuilder().importPartiallySignedTx(tx)
        //TODO: make sure tx can be signed!
        //TODO: verify that tx has input.output
        //verify inputs.input should be type PublicKeyHash
        // i.e. script.isPublicKeyHashOut()
    }

    from(utxos:any[], pubKey:any, sigHash?:number):TransactionBuilder {
        for (let index = 0; index < utxos.length; index++) {
            const utxo = utxos[index]
            this.addInput(utxo,pubKey,sigHash)
        }
        return this
    }

    toAddress(satoshis:number,address:string):TransactionBuilder {
        this.addOutput(satoshis,address)
        return this
    }

    change(address:any): TransactionBuilder {
        this.txb.setChangeAddress(address)
        return this
    }

    //sighash not used until bsv2
    addInput(utxo:UnspentOutput, pubKey:any, sigHash?:any): number {
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
             Buffer.from(utxo.txId,'hex'), 
             //txOutNum
             utxo.outputIndex, 
        //     //txOut
             utxo.toTxOut(),
             pubKey
             //nSequence
        //     0xffffffff,
        //     Sig.SIGHASH_SINGLE 
        )

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
        return this.txb.txIns.length
    }

    addOutput(satoshis:number, address:any) {
        this.txb.outputToAddress(new Bn().fromNumber(satoshis), address)
        //this.txb.to(address, amount)
    }

    buildAndSign(keypair:KeyPair, makeFuture?:boolean): any { /* bsv2 */ 
        // txb.build too restrictive!
        // i.e. "cannot create output lesser than dust"
        //this.txb.build()
        this.txb.tx = new Tx()
        const outAmountBn = this.txb.buildOutputs()
        const inAmountBn = this.txb.buildInputs(outAmountBn, 1)
        this.sign(keypair, makeFuture)
        return this.txb.tx
    }

    //sigtype should be passed in to each input
    sign(keyPair:any, makeFuture?:boolean): any {
        if (makeFuture) {
            //make the tx in the future
            this.txb.tx = this.inTheFuture(this.txb.tx)
        }
        this.txb.signWithKeyPairs([keyPair])
        return this.txb.tx
    }
}
