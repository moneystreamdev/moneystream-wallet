import "core-js/stable";
import "regenerator-runtime/runtime";
import { Wallet } from '../src/Wallet';
import { KeyPair } from '../src/KeyPair';
import { UnspentOutput } from '../src/UnspentOutput';
import { default as IndexingService } from '../src/IndexingService';
export { Wallet, KeyPair, UnspentOutput, IndexingService };
declare global {
    interface Window {
        MoneyStream: any;
    }
}
//# sourceMappingURL=moneystream.d.ts.map