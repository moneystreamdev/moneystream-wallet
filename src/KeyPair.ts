import {
    PrivKey as PrivateKey, 
    PubKey as PublicKey,
    Address, Script} from 'bsv'

// a public and private pair of keys
export class KeyPair {
    privKey:any
    pubKey:any
    constructor(privKey?:any, pubKey?:any) {
        this.privKey = privKey
        this.pubKey = pubKey
    }

    toAddress() {
        return Address.fromPubKey(this.pubKey,'livenet')
    }

    //pay to pub key hash of address
    toScript():any {
        return this.toAddress().toTxOutScript()
        //return Script.buildPublicKeyHashOut(this.toAddress())
    }

    fromRandom():KeyPair {
        const privKey = PrivateKey.fromRandom()
        return this.fromPrivKey(privKey)
    }

    fromPrivKey(privKey:any):KeyPair {
        this.privKey = privKey
        this.pubKey = PublicKey.fromPrivKey(privKey)
        return this
    }

    fromWif(wif:string):KeyPair {
        const privKey = PrivateKey.fromWif(wif)
        return this.fromPrivKey(privKey)
    }

    toWif():string {
        return this.privKey.toWif()
    }

    toXpub():string {
        return this.pubKey.toString()
    }

}
