import "core-js/stable"
import "regenerator-runtime/runtime"

const Buffer = require('safe-buffer').Buffer
import { Hash, Aescbc } from 'bsv'
import { Wallet } from '../src/Wallet'
import { KeyPair } from '../src/KeyPair'
import { UnspentOutput } from '../src/UnspentOutput'
import { default as IndexingService } from '../src/IndexingService'

export { 
    Buffer, Hash, Aescbc,
    Wallet, KeyPair, UnspentOutput,
    IndexingService 
}

declare global {
    interface Window { MoneyStream: any; }
}
window.MoneyStream = { 
    Buffer, Hash, Aescbc,
    Wallet, KeyPair, UnspentOutput,
    IndexingService }