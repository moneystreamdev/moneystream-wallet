import "core-js/stable";
import "regenerator-runtime/runtime";
declare const Buffer: any;
import { Hash, Aescbc } from 'bsv';
import { Wallet } from '../src/Wallet';
import { KeyPair } from '../src/KeyPair';
import { UnspentOutput } from '../src/UnspentOutput';
import { default as IndexingService } from '../src/IndexingService';
export { Buffer, Hash, Aescbc, Wallet, KeyPair, UnspentOutput, IndexingService };
declare global {
    interface Window {
        MoneyStream: any;
    }
}
//# sourceMappingURL=moneystream.d.ts.map