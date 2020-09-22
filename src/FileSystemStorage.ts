import fs from 'fs'

export interface IStorage {
    put(item: string): void
    get(): string
    tryget(): string|null
    backup(): void
}

//currently sync but should be async
export default class FileSystemStorage implements IStorage {
    protected _fileName:string
    constructor(fileName:string) {
        this._fileName = fileName
    }

    put(sWallet:string) {
        // make a backup so that keys are no destroyed
        this.backup()
        try {
            console.log(this._fileName)
            fs.writeFileSync(this._fileName, sWallet, 'utf8')
        }
        catch (err) {
            console.log(err)
            return
        }
    }

    tryget(): string|null {
        try {
            return this.get()
        }
        catch {
            return null
        }
    }

    get() {
        const contents = fs.readFileSync(this._fileName)
        return contents.toString()
    }

    backup() {
        if (fs.existsSync(this._fileName)) {
            let timestamp = (new Date()).toISOString()
            .replace(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).(\d{3})Z$/, '$1$2$3.$4$5$6.$7000000');
            fs.renameSync(this._fileName, `${this._fileName}.${timestamp}`)
        }
    }

}