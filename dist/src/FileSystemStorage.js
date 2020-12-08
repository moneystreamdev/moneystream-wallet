"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
//currently sync but should be async
var FileSystemStorage = /** @class */ (function () {
    function FileSystemStorage(fileName) {
        this._fileName = 'wallet.json';
        if (fileName)
            this._fileName = fileName;
    }
    FileSystemStorage.prototype.setFileName = function (filename) {
        this._fileName = filename;
    };
    FileSystemStorage.prototype.put = function (sWallet) {
        // make a backup so that keys are no destroyed
        this.backup();
        try {
            fs_1.default.writeFileSync(this._fileName, sWallet, 'utf8');
        }
        catch (err) {
            console.log(err);
            return;
        }
    };
    FileSystemStorage.prototype.tryget = function () {
        try {
            return this.get();
        }
        catch (_a) {
            return null;
        }
    };
    FileSystemStorage.prototype.get = function () {
        var contents = fs_1.default.readFileSync(this._fileName);
        return contents.toString();
    };
    FileSystemStorage.prototype.backup = function () {
        if (fs_1.default.existsSync(this._fileName)) {
            var timestamp = (new Date()).toISOString()
                .replace(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).(\d{3})Z$/, '$1$2$3.$4$5$6.$7000000');
            fs_1.default.renameSync(this._fileName, this._fileName + "." + timestamp);
        }
    };
    return FileSystemStorage;
}());
exports.default = FileSystemStorage;
//# sourceMappingURL=FileSystemStorage.js.map