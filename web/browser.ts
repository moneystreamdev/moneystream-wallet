
import "core-js/stable"
import "regenerator-runtime/runtime"

import { KeyPair } from '../src/KeyPair'
console.log('in browser.ts')
console.log(new KeyPair().fromRandom())
console.log(KeyPair)
