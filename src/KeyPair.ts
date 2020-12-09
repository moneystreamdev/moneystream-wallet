import {
    PrivKey as PrivateKey, 
    PubKey as PublicKey,
    Address} from 'bsv'

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
    toOutputScript():any {
        return this.toAddress().toTxOutScript()
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
