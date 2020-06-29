export interface IStorage {
    put(item: string): void;
    backup(): void;
}
export default class FileSystemStorage implements IStorage {
    protected _fileName: string;
    constructor(fileName: string);
    put(sWallet: string): void;
    backup(): void;
}
//# sourceMappingURL=FileSystemStorage.d.ts.map