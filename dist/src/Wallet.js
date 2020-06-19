'use strict';
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
var fs_1 = __importDefault(require("fs"));
var bsv_1 = require("bsv");
var portableFetch_1 = require("./utils/portableFetch");
var KeyPair_1 = require("./KeyPair");
var TransactionBuilder_1 = require("./TransactionBuilder");
// base calss for streaming wallet
// A wallet generates transactions
// TODO: extract wallet storage into separate class
// TODO: extract external API calls into separate class
// TODO: extract debugging formatting into separate class
var Wallet = /** @class */ (function () {
    function Wallet() {
        // certifies "I am signing for my input and output, 
        // anyone else can add inputs and outputs"
        this.SIGN_MY_INPUT = bsv_1.crypto.Signature.SIGHASH_SINGLE
            | bsv_1.crypto.Signature.SIGHASH_ANYONECANPAY
            | bsv_1.crypto.Signature.SIGHASH_FORKID;
        this._isDebug = true;
        this._walletFileName = 'wallet.json';
        this._dustLimit = 500;
    }
    Wallet.prototype.txInDescription = function (txIn, index) {
        var inputValue = txIn.output.satoshis;
        var inputSeq = txIn.sequenceNumber || 0xffffff;
        var inputPrevHash = txIn.prevTxId.toString('hex');
        var inputPrevIndex = txIn.outputIndex;
        var inputPrevHashCondensed = inputPrevHash.slice(0, 4) + "..." + inputPrevHash.slice(-4) + ":" + inputPrevIndex;
        var signingText = (txIn.constructor.name === 'Input' ? "CANNOT SIGN ABSTRACT! " : '')
            + txIn.constructor.name;
        return { value: inputValue, desc: "[" + index + "]" + inputValue + ":" + (inputSeq === 0xffffffff ? 'Final' : inputSeq.toString()) + " spends " + inputPrevHashCondensed + " Type:" + signingText };
    };
    Wallet.prototype.getTxFund = function (tx) {
        if (tx.inputs.length > 0 && tx.outputs.length > 0) {
            var txIn = tx.inputs[0];
            var txout = tx.outputs[0];
            var txInputOut = txIn.output;
            var fund = (txInputOut ? txInputOut.satoshis : 0) - txout.satoshis;
            return fund;
        }
        return 0;
    };
    Wallet.prototype.logDetailsLastTx = function () {
        this.logDetails(this.lastTx);
    };
    Wallet.prototype.logDetails = function (tx) {
        var details = "";
        details += "\n" + this._keypair.toWif();
        details += "\n" + this._keypair.toXpub();
        details += "\n" + this._keypair.toAddress().toString();
        if (tx) {
            details += "\nLocked until " + tx.getLockTime();
            if (tx.inputs && tx.inputs.length > 0) {
                details += "\nInputs " + tx.inputs.length;
            }
            var inputTotal = 0;
            for (var i = 0; i < tx.inputs.length; i++) {
                var txIn = tx.inputs[i];
                var _a = this.txInDescription(txIn, i), value = _a.value, desc = _a.desc;
                details += "\n   " + desc;
                inputTotal += value;
            }
            if (inputTotal)
                details += "\nTotal In:" + inputTotal;
            if (tx.txOuts && tx.txOuts.length > 0) {
                details += "\nOutputs " + tx.txOuts.length;
            }
            var platformTotal = 0;
            var outputTotal = 0;
            for (var i = 0; i < tx.outputs.length; i++) {
                var txout = tx.outputs[i];
                details += "\n   [" + i + "]" + txout.satoshis;
                outputTotal += txout.satoshis;
                if (i > 2)
                    platformTotal += txout.satoshis;
            }
            if (outputTotal)
                details += "\nTotal Out:" + outputTotal;
            var fund = this.getTxFund(tx);
            details += "\nFunding:" + fund;
            platformTotal = fund - this._dustLimit;
            details += "\nPlatform:" + platformTotal;
            var fees = inputTotal - outputTotal;
            details += "\nMiner Fees:" + fees;
            details += "\nFullySigned?" + tx.isFullySigned();
        }
        if (details)
            console.log(details);
    };
    Wallet.prototype.toJSON = function () {
        var walletjson = {
            "wif": this._keypair.toWif(),
            "xpub": this._keypair.toXpub(),
            "address": this._keypair.toAddress().toString()
        };
        return walletjson;
    };
    Wallet.prototype.loadWallet = function (wif) {
        if (wif) {
            this._keypair = new KeyPair_1.KeyPair().fromWif(wif);
        }
        if (!this._keypair) {
            this.generateKey();
            return this.store(this.toJSON());
        }
    };
    Wallet.prototype.generateKey = function () {
        //generate keys, store and return xpub
        this._keypair = new KeyPair_1.KeyPair().fromRandom();
        return this._keypair.pubKey.toString();
    };
    Wallet.prototype.store = function (wallet) {
        var sWallet = JSON.stringify(wallet, null, 2);
        //make a backup so we dont lose keys
        this.backup();
        try {
            fs_1.default.writeFileSync(this._walletFileName, sWallet, 'utf8');
        }
        catch (err) {
            if (err) {
                console.log(err);
                return;
            }
        }
        return wallet;
    };
    Wallet.prototype.backup = function () {
        if (fs_1.default.existsSync(this._walletFileName)) {
            var timestamp = (new Date()).toISOString()
                .replace(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).(\d{3})Z$/, '$1$2$3.$4$5$6.$7000000');
            fs_1.default.renameSync(this._walletFileName, this._walletFileName + "." + timestamp);
        }
    };
    Wallet.prototype.logUtxos = function (utxos) {
        var logit = "In " + this.constructor.name + " " + utxos.length + " Unspent outputs";
        var tot = 0;
        for (var i = 0; i < utxos.length; i++) {
            var utxo = utxos[i];
            logit += "\n" + utxo.value + "x" + utxo.tx_hash.slice(0, 4) + "..." + utxo.tx_hash.slice(-4) + ":" + utxo.tx_pos;
            tot += utxo.value;
        }
        logit += "\nTotal:" + tot;
        console.log(logit);
    };
    //get utxos to cover number of satoshis
    //return array of utxos
    Wallet.prototype.getUtxoFrom = function (utxos, satoshis) {
        var result = [];
        if (utxos.length < 1)
            return result;
        if (utxos.length < 2)
            return [utxos[0]];
        //TODO: sort the utxos by some criteria? value?
        this.logUtxos(utxos);
        var amountremaining = satoshis.toNumber();
        //keep adding outputs until we can cover the amount
        for (var i = 0; i < utxos.length; i++) {
            var utxo = utxos[i];
            result.push(utxo);
            amountremaining -= utxo.value;
            if (amountremaining < 0)
                break;
        }
        return result;
    };
    //todo cache utxos
    Wallet.prototype.getAnUnspentOutput = function (satoshis) {
        return __awaiter(this, void 0, void 0, function () {
            var utxos, utxo0;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this._utxo) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getUtxos(this._keypair.toAddress())
                            //console.log(utxos)
                        ];
                    case 1:
                        utxos = _a.sent();
                        //console.log(utxos)
                        if (utxos.length > 0) {
                            utxo0 = this.getUtxoFrom(utxos, satoshis)[0];
                            console.log(utxo0);
                            //from woc. height 0 means unconfirmed
                            //"height": 578325,
                            // "tx_pos": 0,
                            // "tx_hash": "62824e3af3d01113e9bce8b73576b833990d231357bd718385958c21d50bbddd",
                            // "value": 1250020815
                            // would be nice to get output script!
                            //expecting valueBn, scriptVi, script
                            this._utxo = new bsv_1.Transaction.UnspentOutput({
                                txid: utxo0.tx_hash,
                                vout: utxo0.tx_pos,
                                scriptPubKey: this._keypair.toScript(),
                                //use satoshis, never amount!
                                satoshis: utxo0.value
                            });
                            console.log(this._utxo);
                            //this._utxo_tx_hash = utxo0.tx_hash
                            //this._utxo.amount = utxo0.value
                        }
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    // legacy p2pkh spend
    Wallet.prototype.makeSimpleSpend = function (satoshis) {
        return __awaiter(this, void 0, void 0, function () {
            var utxoSatoshis, changeSatoshis, tx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAnUnspentOutput(satoshis)];
                    case 1:
                        _a.sent();
                        if (!this._utxo) {
                            throw Error('your wallet is empty');
                        }
                        utxoSatoshis = this._utxo.satoshis;
                        changeSatoshis = utxoSatoshis - satoshis.toNumber();
                        if (changeSatoshis < 0) {
                            throw Error("the utxo ran out of money " + changeSatoshis);
                        }
                        tx = new bsv_1.Transaction()
                            .from(this._utxo)
                            .to(this._keypair.toAddress(), changeSatoshis)
                            .change(this._keypair.toAddress());
                        tx.sign(this._keypair.privKey);
                        if (this._isDebug)
                            this.logDetails(tx);
                        this.lastTx = tx;
                        return [2 /*return*/, tx.toString('hex')
                            // tx can be broadcast and put on chain
                        ];
                }
            });
        });
    };
    Wallet.prototype.makeAnyoneCanSpendTx = function (satoshis) {
        return __awaiter(this, void 0, void 0, function () {
            var utxoSatoshis, changeSatoshis, txb, tx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this._utxo) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getAnUnspentOutput(satoshis)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!this._utxo) {
                            throw Error('your wallet is empty');
                        }
                        utxoSatoshis = this._utxo.satoshis;
                        changeSatoshis = utxoSatoshis - satoshis.toNumber();
                        if (changeSatoshis < 0) {
                            throw Error("the utxo ran out of money " + changeSatoshis);
                        }
                        txb = new TransactionBuilder_1.TransactionBuilder();
                        txb.setChangeAddress(this._keypair.toAddress());
                        txb.addInput(this._utxo, this.SIGN_MY_INPUT);
                        txb.addOutput(changeSatoshis, this._keypair.toAddress());
                        txb.build();
                        tx = txb.sign(this._keypair.privKey, this.SIGN_MY_INPUT);
                        //if (this._isDebug) console.log(tx.toJSON())
                        this.lastTx = tx;
                        return [2 /*return*/, tx.toString()
                            // at this point, tx is spendable by anyone!
                            // only pass it through secure channel to recipient
                            // tx needs further processing before broadcast
                        ];
                }
            });
        });
    };
    Wallet.prototype.getApiTxJSON = function (txhash) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "https://api.whatsonchain.com/v1/bsv/main/tx/hash/" + txhash;
                        return [4 /*yield*/, portableFetch_1.portableFetch(url)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.json()];
                }
            });
        });
    };
    //address object
    Wallet.prototype.getUtxos = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "https://api.whatsonchain.com/v1/bsv/main/address/" + address.toString() + "/unspent";
                        return [4 /*yield*/, portableFetch_1.portableFetch(url)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.json()];
                }
            });
        });
    };
    Wallet.prototype.broadcastRaw = function (txhex) {
        return __awaiter(this, void 0, void 0, function () {
            var url, data, body, broadcast;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = 'https://api.whatsonchain.com/v1/bsv/main/tx/raw';
                        data = {
                            "txhex": txhex
                        };
                        body = JSON.stringify(data);
                        return [4 /*yield*/, portableFetch_1.portableFetch(url, {
                                method: "POST",
                                headers: { 'Content-Type': 'application/json' },
                                body: body
                            })];
                    case 1:
                        broadcast = _a.sent();
                        return [2 /*return*/, broadcast.json()];
                }
            });
        });
    };
    return Wallet;
}());
exports.Wallet = Wallet;
//# sourceMappingURL=Wallet.js.map