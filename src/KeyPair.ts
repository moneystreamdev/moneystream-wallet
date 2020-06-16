import {
    PrivateKey, PublicKey,
    Address, Script} from 'bsv'

// a public and private pair of keys
export default class KeyPair {
    privKey:any
    pubKey:any
    constructor(privKey?:any, pubKey?:any) {
        this.privKey = privKey
        this.pubKey = pubKey
    }

    toAddress() {
        return Address.fromPublicKey(this.pubKey,'livenet')
    }

    //pay to pub key hash of address
    toScript() {
        return Script.buildPublicKeyHashOut(this.toAddress())
    }

    fromRandom():KeyPair {
        const privKey = PrivateKey.fromRandom()
        return this.fromPrivKey(privKey)
    }

    fromPrivKey(privKey:any):KeyPair {
        this.privKey = privKey
        this.pubKey = PublicKey.fromPrivateKey(privKey)
        return this
    }

    fromWif(wif:string):KeyPair {
        const privKey = PrivateKey.fromWIF(wif)
        return this.fromPrivKey(privKey)
    }

    toWif():string {
        return this.privKey.toWIF()
    }

    toXpub():string {
        return this.pubKey.toString()
    }

}
