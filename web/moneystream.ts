import "core-js/stable"
import "regenerator-runtime/runtime"

import { Wallet } from '../src/Wallet'
import { KeyPair } from '../src/KeyPair'
import { default as IndexingService } from '../src/IndexingService'

export {Wallet,KeyPair,IndexingService}

declare global {
    interface Window { MoneyStream: any; }
}
window.MoneyStream = { Wallet, KeyPair, IndexingService }