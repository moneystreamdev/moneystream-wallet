export interface IStorage {
    put(item: string): void;
    get(): string;
    tryget(): string | null;
    backup(): void;
}
export default class FileSystemStorage implements IStorage {
    protected _fileName: string;
    constructor(fileName: string);
    put(sWallet: string): void;
    tryget(): string | null;
    get(): string;
    backup(): void;
}
//# sourceMappingURL=FileSystemStorage.d.ts.map