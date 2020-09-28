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
var fs_1 = require("fs");
var Long = __importStar(require("long"));
var KeyPair_1 = require("../../src/KeyPair");
var OutputCollection_1 = require("../../src/OutputCollection");
var UnspentOutput_1 = require("../../src/UnspentOutput");
var bsv_1 = require("bsv");
var dustLimit = 500;
var someHashBufString = '1aebb7d0776cec663cbbdd87f200bf15406adb0ef91916d102bcd7f86c86934e';
var dummyOutput1 = new UnspentOutput_1.UnspentOutput(1000, new KeyPair_1.KeyPair().fromRandom().toOutputScript(), someHashBufString, 0);
var dummyOutput2 = new UnspentOutput_1.UnspentOutput(2000, new KeyPair_1.KeyPair().fromRandom().toOutputScript(), someHashBufString, 1);
function makeDummyTwo() {
    var dummyUtxosTwo = new OutputCollection_1.OutputCollection();
    dummyUtxosTwo.add(new UnspentOutput_1.UnspentOutput(1000, new KeyPair_1.KeyPair().fromRandom().toOutputScript(), someHashBufString, 0));
    //.filter will sort by sats and use #2 before #1
    dummyUtxosTwo.add(new UnspentOutput_1.UnspentOutput(2000, new KeyPair_1.KeyPair().fromRandom().toOutputScript(), someHashBufString, 1));
    return dummyUtxosTwo;
}
function createUtxos(count, satoshis) {
    var lotsOfUtxos = new OutputCollection_1.OutputCollection();
    for (var index = 0; index < count; index++) {
        var testUtxo = new UnspentOutput_1.UnspentOutput(satoshis, new KeyPair_1.KeyPair().fromRandom().toOutputScript(), someHashBufString, index);
        lotsOfUtxos.add(testUtxo);
    }
    return lotsOfUtxos;
}
// tx with no inputs and no outputs
var nofundinghex = '0100000000000d1b345f';
describe('Wallet tests', function () {
    it('should instantiate a wallet object', function () {
        var w = new Wallet_1.Wallet();
        expect(w).toBeInstanceOf(Wallet_1.Wallet);
    });
    it('should error if wallet not loaded', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.selectedUtxos = createUtxos(1, 1000);
                    return [4 /*yield*/, expect(w.makeSimpleSpend(Long.fromNumber(600))).rejects.toThrow(Error)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should spend to address', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, buildResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w.selectedUtxos = createUtxos(1, 1000);
                    return [4 /*yield*/, w.makeSimpleSpend(Long.fromNumber(600), undefined, '1SCVmCzdLaECeRkMq3egwJ6yJLwT1x3wu')];
                case 1:
                    buildResult = _a.sent();
                    expect(buildResult.hex).toBeDefined();
                    expect(buildResult.tx.txOuts[0].valueBn.toNumber()).toBe(600);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should clear wallet', function () {
        var w = new Wallet_1.Wallet();
        w.selectedUtxos = createUtxos(1, 1000);
        expect(w.balance).toBe(1000);
        w.clear();
        expect(w.balance).toBe(0);
        expect(w.selectedUtxos.hasAny()).toBeFalsy();
    });
    it('should create simple tx with no lock time', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, buildResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w.selectedUtxos = createUtxos(1, 1000);
                    return [4 /*yield*/, w.makeSimpleSpend(Long.fromNumber(600))];
                case 1:
                    buildResult = _a.sent();
                    expect(buildResult.hex.length).toBeGreaterThan(20);
                    expect(buildResult.tx.nLockTime).toBe(0);
                    expect(buildResult.tx.txIns.length).toBeGreaterThan(0);
                    expect(buildResult.tx.txOuts.length).toBeGreaterThan(0);
                    expect(buildResult.tx.txOuts[0].valueBn.toNumber()).toBe(600);
                    w.logDetailsLastTx();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should create streamable tx with lock time', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, buildResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w.selectedUtxos = createUtxos(1, 1000);
                    return [4 /*yield*/, w.makeStreamableCashTx(Long.fromNumber(1000))];
                case 1:
                    buildResult = _a.sent();
                    expect(buildResult.hex.length).toBeGreaterThan(20);
                    expect(buildResult.tx.nLockTime).toBeGreaterThan(0);
                    expect(buildResult.tx.txIns.length).toBeGreaterThan(0);
                    expect(buildResult.tx.txOuts.length).toBe(0);
                    expect(w.getTxFund(buildResult.tx)).toBe(1000);
                    // add extra output
                    buildResult.tx.addTxOut(new bsv_1.Bn().fromNumber(1), new KeyPair_1.KeyPair().fromRandom().toOutputScript());
                    // funding should not change
                    expect(w.getTxFund(buildResult.tx)).toBe(1000);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should create streamable tx with no lock time', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, buildResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w.selectedUtxos = createUtxos(1, 1000);
                    return [4 /*yield*/, w.makeStreamableCashTx(Long.fromNumber(1000), undefined, false)];
                case 1:
                    buildResult = _a.sent();
                    expect(buildResult.hex.length).toBeGreaterThan(20);
                    expect(buildResult.tx.nLockTime).toBe(0);
                    expect(buildResult.tx.txIns.length).toBeGreaterThan(0);
                    expect(buildResult.tx.txOuts.length).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should create streamable tx with one input', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, buildResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w.selectedUtxos = makeDummyTwo();
                    return [4 /*yield*/, w.makeStreamableCashTx(Long.fromNumber(dummyOutput1.satoshis - dustLimit - 1))];
                case 1:
                    buildResult = _a.sent();
                    expect(buildResult.hex.length).toBeGreaterThan(20);
                    expect(buildResult.tx.txIns.length).toBe(1);
                    expect(buildResult.tx.txOuts.length).toBe(1);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should create streamable tx with exact input', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, tokensLessDust, buildResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w.selectedUtxos = makeDummyTwo();
                    tokensLessDust = 1000 - 500;
                    return [4 /*yield*/, w.makeStreamableCashTx(Long.fromNumber(tokensLessDust), new KeyPair_1.KeyPair().fromRandom().toOutputScript())];
                case 1:
                    buildResult = _a.sent();
                    expect(buildResult.hex.length).toBeGreaterThan(20);
                    expect(buildResult.tx.txIns.length).toBe(1);
                    expect(buildResult.tx.txOuts.length).toBe(2);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should create streamable tx with multiple inputs', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, buildResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w.selectedUtxos = makeDummyTwo();
                    return [4 /*yield*/, w.makeStreamableCashTx(Long.fromNumber(2500))];
                case 1:
                    buildResult = _a.sent();
                    expect(buildResult.hex.length).toBeGreaterThan(20);
                    expect(buildResult.tx.txIns.length).toBe(2);
                    expect(buildResult.tx.txOuts.length).toBe(1);
                    expect(buildResult.tx.txOuts[0].valueBn.toNumber()).toBe(500);
                    expect(w.getTxFund(w.lastTx)).toBe(2500);
                    // add an output, funding doesnt change
                    buildResult.tx.addTxOut(new bsv_1.Bn().fromNumber(100), w.keyPair.toOutputScript());
                    expect(w.getTxFund(w.lastTx)).toBe(2500);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should create streamable tx with increasing', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, buildResult, buildResult2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w.selectedUtxos = makeDummyTwo();
                    return [4 /*yield*/, w.makeStreamableCashTx(Long.fromNumber(100))];
                case 1:
                    buildResult = _a.sent();
                    expect(buildResult.hex.length).toBeGreaterThan(20);
                    expect(buildResult.tx.txIns.length).toBe(1);
                    expect(buildResult.tx.txOuts.length).toBe(1);
                    expect(buildResult.tx.txOuts[0].valueBn.toNumber()).toBe(1900);
                    //expect(buildResult.tx.txOuts[1].valueBn.toNumber()).toBe(500)
                    expect(w.getTxFund(w.lastTx)).toBe(100);
                    return [4 /*yield*/, w.makeStreamableCashTx(Long.fromNumber(2100), null, true, buildResult.utxos)];
                case 2:
                    buildResult2 = _a.sent();
                    expect(buildResult2.hex.length).toBeGreaterThan(20);
                    expect(buildResult2.tx.txIns.length).toBe(2);
                    w.logDetailsLastTx();
                    expect(w.getTxFund(buildResult2.tx)).toBe(2100);
                    expect(buildResult2.tx.txOuts.length).toBe(1);
                    expect(buildResult2.tx.txOuts[0].valueBn.toNumber()).toBe(900);
                    return [2 /*return*/];
            }
        });
    }); });
    it('funds tx with one input', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, buildResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w.selectedUtxos = createUtxos(1, 1000);
                    return [4 /*yield*/, w.makeStreamableCashTx(Long.fromNumber(100))];
                case 1:
                    buildResult = _a.sent();
                    expect(buildResult.tx).toBeDefined();
                    expect(w.getTxFund(w.lastTx)).toBe(100);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should log utxos', function () {
        var w = new Wallet_1.Wallet();
        w.selectedUtxos = makeDummyTwo();
        w.logUtxos(w.selectedUtxos.items);
    });
    it('should create tx to split a utxo', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, utxos, buildResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    utxos = new OutputCollection_1.OutputCollection();
                    utxos.add(new UnspentOutput_1.UnspentOutput(10000, w.keyPair.toOutputScript(), someHashBufString, 0));
                    return [4 /*yield*/, w.split(utxos, 10, 1000)];
                case 1:
                    buildResult = _a.sent();
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx.txIns.length).toBe(1);
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx.txOuts.length).toBe(10);
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx.txOuts[0].valueBn.toNumber()).toBe(974);
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx.txOuts[9].valueBn.toNumber()).toBe(974);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should create tx to split a utxo', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, utxos, total, count, splitAmount, buildResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    utxos = new OutputCollection_1.OutputCollection();
                    utxos.add(new UnspentOutput_1.UnspentOutput(3611, w.keyPair.toOutputScript(), someHashBufString, 0));
                    utxos.add(new UnspentOutput_1.UnspentOutput(3450, w.keyPair.toOutputScript(), someHashBufString, 1));
                    utxos.add(new UnspentOutput_1.UnspentOutput(5323, w.keyPair.toOutputScript(), someHashBufString, 2));
                    utxos.add(new UnspentOutput_1.UnspentOutput(2987, w.keyPair.toOutputScript(), someHashBufString, 3));
                    utxos.add(new UnspentOutput_1.UnspentOutput(2987, w.keyPair.toOutputScript(), someHashBufString, 4));
                    utxos.add(new UnspentOutput_1.UnspentOutput(2487, w.keyPair.toOutputScript(), someHashBufString, 5));
                    total = 5323 //utxos.satoshis
                    ;
                    count = 7;
                    splitAmount = Math.floor(total / count);
                    return [4 /*yield*/, w.split(utxos, count, 600)];
                case 1:
                    buildResult = _a.sent();
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx.txIns.length).toBe(1);
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx.txOuts.length).toBe(count);
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx.txOuts[0].valueBn.toNumber()).toBe(600);
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx.txOuts[count - 1].valueBn.toNumber()).toBeGreaterThan(545);
                    expect(splitAmount).toBeGreaterThan(545);
                    //TODO: make sure fee is reasonable before broadcast
                    w.logDetails(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should get wallet balance', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, lotsOfUtxos;
        return __generator(this, function (_a) {
            w = new Wallet_1.Wallet();
            w.loadWallet();
            lotsOfUtxos = createUtxos(9, 1);
            expect(lotsOfUtxos.count).toBe(9);
            w.selectedUtxos = lotsOfUtxos;
            expect(w.balance).toBe(9);
            return [2 /*return*/];
        });
    }); });
    it('should create streamable tx with more than 256 inputs', function () { return __awaiter(void 0, void 0, void 0, function () {
        var size, w, lotsOfUtxos, buildResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    size = 258;
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    lotsOfUtxos = createUtxos(size, 1000);
                    expect(lotsOfUtxos.count).toBe(size);
                    w.selectedUtxos = lotsOfUtxos;
                    return [4 /*yield*/, w.makeStreamableCashTx(Long.fromNumber(size * 1000))];
                case 1:
                    buildResult = _a.sent();
                    expect(buildResult.hex.length).toBeGreaterThan(20);
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx.nLockTime).toBeGreaterThan(0);
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx.txIns.length).toBe(size);
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx.txOuts.length).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
    it('encumbers utxo', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, buildResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w.selectedUtxos = createUtxos(1, 1000);
                    return [4 /*yield*/, w.makeStreamableCashTx(Long.fromNumber(100))];
                case 1:
                    buildResult = _a.sent();
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx).toBeDefined();
                    expect(w.getTxFund(w.lastTx)).toBe(100);
                    expect(w.selectedUtxos.firstItem.status).toBe('hold');
                    return [2 /*return*/];
            }
        });
    }); });
    it('errors multiple streams one utxo', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, stream1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w.selectedUtxos = createUtxos(1, 1000);
                    return [4 /*yield*/, w.makeStreamableCashTx(Long.fromNumber(100))];
                case 1:
                    stream1 = _a.sent();
                    expect(stream1.tx).toBeDefined();
                    expect(w.getTxFund(w.lastTx)).toBe(100);
                    expect(w.selectedUtxos.firstItem.status).toBe('hold');
                    //this should error because single utxo already encumbered
                    expect(w.makeStreamableCashTx(Long.fromNumber(100))).rejects.toThrow(Error);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should error making empty transaction', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w;
        return __generator(this, function (_a) {
            w = new Wallet_1.Wallet();
            expect(w).toBeInstanceOf(Wallet_1.Wallet);
            w.loadWallet();
            // should error because stream cannot be funded
            // at all
            expect(w.makeStreamableCashTx(Long.fromNumber(250), null, true, new OutputCollection_1.OutputCollection())).rejects.toThrow(Error);
            return [2 /*return*/];
        });
    }); });
    it('tests funding zero', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, buildResult, utxo, txinout;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.allowZeroFunding = true;
                    w.loadWallet();
                    w.selectedUtxos = new OutputCollection_1.OutputCollection();
                    return [4 /*yield*/, w.makeStreamableCashTx(Long.fromNumber(0))];
                case 1:
                    buildResult = _a.sent();
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx).toBeDefined();
                    expect(w.fundingInputCount).toBe(0);
                    expect(w.getTxFund(buildResult.tx)).toBe(0);
                    expect(w.senderOutputCount).toBe(0);
                    buildResult.tx.addTxIn(someHashBufString, 0, new bsv_1.Script());
                    utxo = UnspentOutput_1.UnspentOutput.fromTxOut(bsv_1.TxOut.fromProperties(new bsv_1.Bn(999), w.keyPair.toOutputScript()), someHashBufString, 0);
                    w.selectedUtxos.add(utxo);
                    buildResult.tx.addTxOut(new bsv_1.Bn().fromNumber(100), w.keyPair.toOutputScript());
                    w.logDetailsLastTx();
                    expect(w.senderOutputCount).toBe(0);
                    expect(w.fundingInputCount).toBe(0);
                    txinout = w.getInputOutput(buildResult.tx.txIns[0], 0);
                    expect(txinout).toBeInstanceOf(UnspentOutput_1.UnspentOutput);
                    expect(w.getTxFund(buildResult.tx)).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
    it('tests funding more', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, buildResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w.selectedUtxos = createUtxos(1, 1000);
                    return [4 /*yield*/, w.makeStreamableCashTx(Long.fromNumber(0))];
                case 1:
                    buildResult = _a.sent();
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx).toBeDefined();
                    expect(w.fundingInputCount).toBe(1);
                    expect(w.senderOutputCount).toBe(1);
                    expect(w.getTxFund(buildResult.tx)).toBe(0);
                    // add more inputs and outputs, not part of funding
                    buildResult.tx.addTxIn(someHashBufString, 0, new bsv_1.Script());
                    buildResult.tx.addTxOut(new bsv_1.Bn().fromNumber(100), w.keyPair.toOutputScript());
                    expect(w.senderOutputCount).toBe(1);
                    expect(w.fundingInputCount).toBe(1);
                    w.logDetailsLastTx();
                    expect(w.getTxFund(buildResult.tx)).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
    it('adds data output', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, buildResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w.selectedUtxos = createUtxos(1, 1000);
                    return [4 /*yield*/, w.makeStreamableCashTx(Long.fromNumber(100), null, true, undefined, Buffer.from('moneystream'))];
                case 1:
                    buildResult = _a.sent();
                    w.logDetailsLastTx();
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx).toBeDefined();
                    expect(w.getTxFund(w.lastTx)).toBe(100);
                    expect(buildResult.tx.txOuts.length).toBe(2);
                    expect(buildResult.tx.txOuts[1].script.isSafeDataOut()).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
    it('adds payto', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, buildResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w.selectedUtxos = createUtxos(1, 1000);
                    return [4 /*yield*/, w.makeStreamableCashTx(Long.fromNumber(100), w.keyPair.toOutputScript(), true, undefined)];
                case 1:
                    buildResult = _a.sent();
                    w.logDetailsLastTx();
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx).toBeDefined();
                    expect(w.getTxFund(w.lastTx)).toBe(100);
                    expect(buildResult.tx.txOuts.length).toBe(2);
                    return [2 /*return*/];
            }
        });
    }); });
    it('adds payto array single', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, buildResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w.selectedUtxos = createUtxos(1, 1000);
                    return [4 /*yield*/, w.makeStreamableCashTx(Long.fromNumber(100), [{ to: w.keyPair.toOutputScript(), percent: 100 }], true, undefined)];
                case 1:
                    buildResult = _a.sent();
                    w.logDetailsLastTx();
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx).toBeDefined();
                    expect(w.getTxFund(w.lastTx)).toBe(100);
                    expect(w.getTxSummary(w.lastTx).output).toBe(1000);
                    expect(buildResult.tx.txOuts.length).toBe(2);
                    return [2 /*return*/];
            }
        });
    }); });
    it('adds payto array double', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, buildResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w.selectedUtxos = createUtxos(1, 1000);
                    return [4 /*yield*/, w.makeStreamableCashTx(Long.fromNumber(100), [
                            { to: w.keyPair.toOutputScript(), percent: 50 },
                            { to: w.keyPair.toOutputScript(), percent: 50 },
                        ], true, undefined)];
                case 1:
                    buildResult = _a.sent();
                    w.logDetailsLastTx();
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx).toBeDefined();
                    expect(w.getTxFund(w.lastTx)).toBe(100);
                    expect(w.getTxSummary(w.lastTx).output).toBe(1000);
                    expect(buildResult.tx.txOuts.length).toBe(3);
                    return [2 /*return*/];
            }
        });
    }); });
    it('adds payto array tripple', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, buildResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w.selectedUtxos = createUtxos(1, 2000);
                    return [4 /*yield*/, w.makeStreamableCashTx(Long.fromNumber(1000), [
                            { to: w.keyPair.toOutputScript(), percent: 33.4 },
                            { to: w.keyPair.toOutputScript(), percent: 33.3 },
                            { to: w.keyPair.toOutputScript(), percent: 33.3 },
                        ], true, undefined)];
                case 1:
                    buildResult = _a.sent();
                    w.logDetailsLastTx();
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx).toBeDefined();
                    expect(w.getTxFund(w.lastTx)).toBe(1000);
                    expect(w.getTxSummary(w.lastTx).output).toBe(2000);
                    expect(buildResult.tx.txOuts.length).toBe(4);
                    return [2 /*return*/];
            }
        });
    }); });
    it('adds payto array tripple', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, buildResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w.selectedUtxos = createUtxos(1, 1000);
                    return [4 /*yield*/, w.makeStreamableCashTx(Long.fromNumber(100), [
                            { to: w.keyPair.toOutputScript(), percent: 33.4 },
                            { to: w.keyPair.toOutputScript(), percent: 33.3 },
                            { to: w.keyPair.toOutputScript(), percent: 33.3 },
                        ], true, undefined)];
                case 1:
                    buildResult = _a.sent();
                    w.logDetailsLastTx();
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx).toBeDefined();
                    expect(w.getTxFund(w.lastTx)).toBe(100);
                    expect(w.getTxSummary(w.lastTx).output).toBe(1000);
                    expect(buildResult.tx.txOuts.length).toBe(4);
                    return [2 /*return*/];
            }
        });
    }); });
    it('adds payto array tripple', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, buildResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w.selectedUtxos = createUtxos(1, 1000);
                    return [4 /*yield*/, w.makeStreamableCashTx(Long.fromNumber(100), [
                            { to: w.keyPair.toOutputScript(), percent: 25 },
                            { to: w.keyPair.toOutputScript(), percent: 50 },
                            { to: w.keyPair.toOutputScript(), percent: 25 },
                        ], true, undefined)];
                case 1:
                    buildResult = _a.sent();
                    w.logDetailsLastTx();
                    expect(buildResult === null || buildResult === void 0 ? void 0 : buildResult.tx).toBeDefined();
                    expect(w.getTxFund(w.lastTx)).toBe(100);
                    expect(w.getTxSummary(w.lastTx).output).toBe(1000);
                    expect(buildResult.tx.txOuts.length).toBe(4);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should load json', function () { return __awaiter(void 0, void 0, void 0, function () {
        var w, w2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = new Wallet_1.Wallet();
                    w.loadWallet();
                    w.fileName = 'wallet.test.json';
                    return [4 /*yield*/, w.store(w.toJSON())];
                case 1:
                    _a.sent();
                    expect(fs_1.existsSync(w.fileName)).toBe(true);
                    w2 = new Wallet_1.Wallet();
                    w2.loadWalletFromJSON(w.fileName);
                    expect(w.keyPair.toWif()).toBe(w2.keyPair.toWif());
                    fs_1.unlinkSync(w.fileName);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=wallet.test.js.map