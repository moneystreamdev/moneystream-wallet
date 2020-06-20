"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var Wallet_1 = require("../../src/Wallet");
var Long = __importStar(require("long"));
var bsv_1 = require("bsv");
var KeyPair_1 = require("../../src/KeyPair");
var OutputCollection_1 = require("../../src/OutputCollection");
var dustLimit = 500;
var dummyOutput1 = new bsv_1.Transaction.UnspentOutput({
    txId: "1aebb7d0776cec663cbbdd87f200bf15406adb0ef91916d102bcd7f86c86934e",
    vout: 0,
    scriptPubKey: new KeyPair_1.KeyPair().fromRandom().toScript(),
    satoshis: 1000
});
var dummyOutput2 = new bsv_1.Transaction.UnspentOutput({
    txId: "1aebb7d0776cec663cbbdd87f200bf15406adb0ef91916d102bcd7f86c86934e",
    vout: 1,
    scriptPubKey: new KeyPair_1.KeyPair().fromRandom().toScript(),
    satoshis: 2000
});
var dummyUtxosOne = new OutputCollection_1.OutputCollection();
dummyUtxosOne.add(dummyOutput1);
var dummyUtxosTwo = new OutputCollection_1.OutputCollection();
dummyUtxosTwo.add(dummyOutput1);
//.filter will sort by sats and use #2 before #1
dummyUtxosTwo.add(dummyOutput2);
describe('Wallet tests', function () {
    it('should instantiate a wallet object', function () {
        var w = new Wallet_1.Wallet();
        expect(w).toBeInstanceOf(Wallet_1.Wallet);
    });
    it('should create simple tx with no lock time', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w._selectedUtxos = dummyUtxosOne;
                    return [4 /*yield*/, w.makeSimpleSpend(Long.fromNumber(1000))];
                case 1:
                    _a.sent();
                    expect(w.lastTx.nLockTime).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should create streamable tx with lock time', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w._selectedUtxos = dummyUtxosOne;
                    return [4 /*yield*/, w.makeAnyoneCanSpendTx(Long.fromNumber(1000))];
                case 1:
                    _a.sent();
                    expect(w.lastTx.nLockTime).toBeGreaterThan(0);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should create streamable tx with one input', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w._selectedUtxos = dummyUtxosTwo;
                    return [4 /*yield*/, w.makeAnyoneCanSpendTx(Long.fromNumber(dummyOutput1.satoshis - dustLimit - 1))];
                case 1:
                    _a.sent();
                    expect(w.lastTx.inputs.length).toBe(1);
                    expect(w.lastTx.outputs.length).toBe(1);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should create streamable tx with exactly input', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, tokensLessDust;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w._selectedUtxos = dummyUtxosTwo;
                    tokensLessDust = 1000 - 500;
                    return [4 /*yield*/, w.makeAnyoneCanSpendTx(Long.fromNumber(tokensLessDust), '1KUrv2Ns8SwNkLgVKrVbSHJmdXLpsEvaDf')];
                case 1:
                    _a.sent();
                    expect(w.lastTx.inputs.length).toBe(1);
                    expect(w.lastTx.outputs.length).toBe(2);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should create streamable tx with multiple inputs', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w._selectedUtxos = dummyUtxosTwo;
                    //wallet will sort utxo by sats
                    return [4 /*yield*/, w.makeAnyoneCanSpendTx(Long.fromNumber(2500))];
                case 1:
                    //wallet will sort utxo by sats
                    _a.sent();
                    expect(w.lastTx.inputs.length).toBe(2);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=wallet.test.js.map