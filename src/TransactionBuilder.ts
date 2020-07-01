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
        //allow any dust output
        // let web site manage dust policy
        this.txb.setDust(0)
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

    // spend a utxo
    // pubkey is the address it was spent from
    // sighash is the signing method for the input
    addInput(utxo:UnspentOutput, pubKey:any, sigHash?:any): number {
        // make sure this utxo will not get chosen in another session
        utxo.encumber()
        //spend utxo as input, first 3 param required
        this.txb.inputFromPubKeyHash(
             //txHashBuf
             Buffer.from(utxo.txId,'hex'), 
             //txOutNum
             utxo.outputIndex, 
             //txOut
             utxo.toTxOut(),
             pubKey,
             this.FINAL,
             sigHash
        )
        //return the new length of inputs
        return this.txb.txIns.length
    }

    addOutput(satoshis:number, address:any) {
        this.txb.outputToAddress(new Bn().fromNumber(satoshis), address)
    }

    //TODO: might be able to use txbuilder?
    buildAndSign(keypair:KeyPair, makeFuture?:boolean): any {
        this.txb.tx = new Tx()
        const outAmountBn = this.txb.buildOutputs()
        //use all inputs so that user can spend dust if they want
        let extraInputsNum = this.txb.txIns.length - 1
        const inAmountBn = this.txb.buildInputs(outAmountBn, extraInputsNum)
        this.sign(keypair, makeFuture)
        return this.txb.tx
    }

    //sigtype was passed in to each input
    sign(keyPair:any, makeFuture?:boolean): any {
        if (makeFuture) {
            //make the tx in the future
            this.txb.tx = this.inTheFuture(this.txb.tx)
        }
        this.txb.signWithKeyPairs([keyPair])
        return this.txb.tx
    }
}
