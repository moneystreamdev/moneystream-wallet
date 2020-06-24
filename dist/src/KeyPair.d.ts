export declare class KeyPair {
    privKey: any;
    pubKey: any;
    constructor(privKey?: any, pubKey?: any);
    toAddress(): any;
    toOutputScript(): any;
    fromRandom(): KeyPair;
    fromPrivKey(privKey: any): KeyPair;
    fromWif(wif: string): KeyPair;
    toWif(): string;
    toXpub(): string;
}
//# sourceMappingURL=KeyPair.d.ts.map