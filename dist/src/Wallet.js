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
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
exports.Wallet = void 0;
var KeyPair_1 = require("./KeyPair");
var TransactionBuilder_1 = require("./TransactionBuilder");
var OutputCollection_1 = require("./OutputCollection");
var UnspentOutput_1 = require("./UnspentOutput");
var bsv_1 = require("bsv");
// base class for streaming wallet
// A wallet generates transactions
// TODO: extract wallet storage into separate class
// TODO: extract debugging formatting into separate class
var Wallet = /** @class */ (function () {
    function Wallet(storage, index) {
        this.FINAL = 0xffffffff;
        this._maxInputs = 999;
        // if true, allows wallet to be completely spent
        this._allowFundingBelowRequested = true;
        this._allowZeroFunding = false;
        //true if user can combine inputs to extend session
        this._allowMultipleInputs = true;
        //outputs that this wallet needs to deal with
        //could be outputs for our wallet
        //or others, if we import tx from others
        //txoutmap is collection to know the value of the TxIn
        //txbuilder has reference to txoutmap, use that instead?
        //private _txOutMap:any
        // a previously encumbered utxo
        this._selectedUtxos = null;
        this.feePerKbNum = 50;
        // certifies "I am signing for my input and output, 
        // anyone else can add inputs and outputs"
        this.SIGN_INPUT_CHANGE = bsv_1.Sig.SIGHASH_SINGLE
            | bsv_1.Sig.SIGHASH_ANYONECANPAY
            | bsv_1.Sig.SIGHASH_FORKID;
        this.SIGN_INPUT_NOCHANGE = bsv_1.Sig.SIGHASH_NONE
            | bsv_1.Sig.SIGHASH_ANYONECANPAY
            | bsv_1.Sig.SIGHASH_FORKID;
        this._isDebug = true;
        this._walletFileName = 'wallet.json';
        this._dustLimit = 140;
        this._storage = storage; //|| new FileSystemStorage(this._walletFileName)
        this._index = index; //|| new IndexingService()
    }
    Object.defineProperty(Wallet.prototype, "keyPair", {
        get: function () { return this._keypair; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Wallet.prototype, "selectedUtxos", {
        get: function () {
            if (!this._selectedUtxos)
                this._selectedUtxos = new OutputCollection_1.OutputCollection();
            return this._selectedUtxos;
        },
        set: function (val) { this._selectedUtxos = val; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Wallet.prototype, "balance", {
        get: function () {
            var _a;
            if (!this._selectedUtxos)
                return 0;
            return ((_a = this.selectedUtxos) === null || _a === void 0 ? void 0 : _a.balance) || 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Wallet.prototype, "fundingInputCount", {
        get: function () { return this._fundingInputCount; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Wallet.prototype, "senderOutputCount", {
        get: function () { return this._senderOutputCount; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Wallet.prototype, "allowZeroFunding", {
        set: function (val) { this._allowZeroFunding = val; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Wallet.prototype, "allowFundingBelowRequested", {
        set: function (val) { this._allowZeroFunding = val; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Wallet.prototype, "fileName", {
        get: function () { return this._walletFileName; },
        set: function (val) {
            this._walletFileName = val;
            this._storage.setFileName(this._walletFileName);
        },
        enumerable: false,
        configurable: true
    });
    Wallet.prototype.clear = function () {
        this._selectedUtxos = null;
    };
    Wallet.prototype.pad = function (pad, str, padLeft) {
        if (typeof str === 'undefined')
            return pad;
        if (padLeft) {
            return (pad + str).slice(-pad.length);
        }
        else {
            return (str + pad).substring(0, pad.length);
        }
    };
    Wallet.prototype.txInDescription = function (txIn, index) {
        var _a;
        var inputValue = (_a = this.getInputOutput(txIn, index)) === null || _a === void 0 ? void 0 : _a.satoshis;
        var inputSeq = txIn.nSequence || this.FINAL;
        var inputPrevHash = txIn.txHashBuf.toString('hex');
        var inputPrevIndex = txIn.txOutNum;
        var inputPrevHashCondensed = "".concat(inputPrevHash.slice(0, 4), "...").concat(inputPrevHash.slice(-4), ":").concat(inputPrevIndex);
        var signingText = (txIn.constructor.name === 'Input' ? "CANNOT SIGN ABSTRACT! " : '');
        return { value: inputValue, desc: "".concat(txIn.constructor.name, "[").concat(index, "]").concat(this.pad('        ', inputValue === null || inputValue === void 0 ? void 0 : inputValue.toString(), true), ":").concat(inputSeq === this.FINAL ? 'Final' : inputSeq.toString(), " spends ").concat(inputPrevHashCondensed, " ").concat(signingText) };
    };
    //get the txout that the txin is spending
    Wallet.prototype.getInputOutput = function (txin, index) {
        var _a;
        //txout being spent will probably be in _selectedUtxos
        return (_a = this._selectedUtxos) === null || _a === void 0 ? void 0 : _a.find(txin.txHashBuf, txin.txOutNum);
    };
    Wallet.prototype.getTxFund = function (tx) {
        var fundingTotal = 0;
        if (tx.txIns.length > 0) {
            var len = this.fundingInputCount === null || this.fundingInputCount === undefined
                ? tx.txIns.length : this.fundingInputCount;
            for (var index = 0; index < len; index++) {
                var txin = tx.txIns[index];
                var txInputOut = this.getInputOutput(txin, index);
                fundingTotal += (txInputOut ? txInputOut.satoshis : 0);
            }
            // only subtract the output if it comes from the sender
            if (this._senderOutputCount === undefined || this._senderOutputCount > 0) {
                var txout = tx.txOuts[0];
                fundingTotal -= (txout ? txout.valueBn.toNumber() : 0);
            }
        }
        return fundingTotal;
    };
    Wallet.prototype.getTxSummary = function (tx) {
        var totins = 0;
        for (var index = 0; index < tx.txIns.length; index++) {
            var txin = tx.txIns[index];
            var txInputOut = this.getInputOutput(txin, index);
            totins += (txInputOut ? txInputOut.satoshis : 0);
        }
        return {
            input: totins,
            output: tx.txOuts.reduce(function (x, curr) { return x + curr.valueBn.toNumber(); }, 0)
        };
    };
    Wallet.prototype.logDetailsLastTx = function () {
        this.logDetails(this.lastTx);
    };
    Wallet.prototype.logDetails = function (tx) {
        var _a, _b;
        var details = "";
        details += "\n".concat(this._keypair.toAddress().toString());
        if (tx) {
            //TODO: translate locktime to date time
            details += "\nLocked until ".concat(tx.nLockTime);
            if (tx.txIns && tx.txIns.length > 0) {
                details += "\nInputs ".concat(tx.txIns.length);
            }
            var inputTotal = 0;
            for (var i = 0; i < tx.txIns.length; i++) {
                var txIn = tx.txIns[i];
                var _c = this.txInDescription(txIn, i), value = _c.value, desc = _c.desc;
                details += "\n   ".concat(desc);
                inputTotal += value ? value : 0;
            }
            if (inputTotal)
                details += "\nTotal In:".concat(inputTotal);
            var platformTotal = 0;
            var outputTotal = 0;
            for (var i = 0; i < tx.txOuts.length; i++) {
                var txout = tx.txOuts[i];
                var satoshis = txout.valueBn.toNumber();
                details += "\n   TxOut[".concat(i, "]").concat(this.pad('        ', satoshis.toString(), true));
                if ((_a = txout.script) === null || _a === void 0 ? void 0 : _a.isSafeDataOut()) {
                    details += " ".concat(txout.script.getData());
                }
                if ((_b = txout.script) === null || _b === void 0 ? void 0 : _b.isPubKeyHashOut()) {
                    details += " P2PKH";
                }
                outputTotal += satoshis;
                if (i > 2)
                    platformTotal += satoshis;
            }
            var lineTotal = "\n";
            if (outputTotal)
                lineTotal += "Total Out:".concat(outputTotal);
            var fund = this.getTxFund(tx);
            lineTotal += "\tFunding:".concat(fund);
            platformTotal = fund;
            lineTotal += "\tPlatform:".concat(platformTotal);
            var minerFee = inputTotal - outputTotal - platformTotal;
            lineTotal += "\tMiner Fee:".concat(minerFee);
            //TODO: add back to bsv2
            //details += `\nFullySigned?${tx.isFullySigned()}`
            details += lineTotal;
        }
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
    Wallet.prototype.loadWalletFromJSON = function (fileName) {
        this._walletFileName = fileName;
        this._storage.setFileName(this._walletFileName);
        var content = this._storage.tryget();
        var jcontent = JSON.parse(content || '{}');
        this.loadWallet(jcontent === null || jcontent === void 0 ? void 0 : jcontent.wif);
    };
    Wallet.prototype.loadWallet = function (wif) {
        if (wif) {
            this._keypair = new KeyPair_1.KeyPair().fromWif(wif);
        }
        else {
            // try to load wallet from storage?
        }
        if (!this._keypair) {
            this.generateKey();
        }
    };
    Wallet.prototype.generateKey = function () {
        this._keypair = new KeyPair_1.KeyPair().fromRandom();
        return this._keypair.pubKey.toString();
    };
    Wallet.prototype.store = function (wallet) {
        return __awaiter(this, void 0, void 0, function () {
            var sWallet;
            return __generator(this, function (_a) {
                sWallet = JSON.stringify(wallet, null, 2);
                this._storage.put(sWallet);
                return [2 /*return*/, wallet];
            });
        });
    };
    Wallet.prototype.loadUnspent = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getAnUnspentOutput(true)];
            });
        });
    };
    // use OutputCollection.items
    Wallet.prototype.logUtxos = function (utxos) {
        var logit = "In ".concat(this.constructor.name, " ").concat(utxos.length, " Unspent outputs");
        var tot = 0;
        for (var i = 0; i < utxos.length; i++) {
            var utxo = utxos[i];
            logit += "\n".concat(utxo.satoshis, "sat ").concat(utxo.txId.slice(0, 4), "...").concat(utxo.txId.slice(-4), ":").concat(utxo.outputIndex);
            tot += utxo.satoshis;
        }
        logit += "\nTotal:".concat(tot);
        console.log(logit);
    };
    //todo cache utxos
    Wallet.prototype.getAnUnspentOutput = function (force) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var utxos, i, utxo0, newutxo, addcount;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(force || !((_a = this._selectedUtxos) === null || _a === void 0 ? void 0 : _a.hasAny()))) return [3 /*break*/, 2];
                        if (!this._index) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._index.getUtxosAPI(this._keypair.toAddress())];
                    case 1:
                        utxos = _b.sent();
                        if (utxos && utxos.length > 0) {
                            for (i = 0; i < utxos.length; i++) {
                                utxo0 = utxos[i];
                                newutxo = new UnspentOutput_1.UnspentOutput(utxo0.value, this._keypair.toOutputScript(), Buffer.from(utxo0.tx_hash, 'hex').reverse().toString('hex'), utxo0.tx_pos, undefined, this._keypair.toAddress().toString());
                                addcount = this.selectedUtxos.add_conditional(newutxo);
                            }
                        }
                        _b.label = 2;
                    case 2: return [2 /*return*/, this.selectedUtxos];
                }
            });
        });
    };
    // call this to spend a utxo
    // replaces a spent utxo with a new upspent
    // tx is the built transaction
    // txid is id that has been successfully broadcast
    Wallet.prototype.spendUtxos = function (utxos, txBuilt, index, txidBroadcast) {
        if (utxos.encumbered().count === 0) {
            throw new Error("wallet does not have any encumbered utxo");
        }
        try {
            //TODO: loop and process all utxos that were spent
            // bad assumption, for now assume just one
            utxos.encumbered().firstItem.spend();
            var replacementOut = txBuilt.txOuts[index];
            var txid = Buffer.from(txidBroadcast, 'hex').reverse().toString('hex');
            var replacementUtxo = UnspentOutput_1.UnspentOutput.fromTxOut(replacementOut, txid, index);
            replacementUtxo.walletId = this.keyPair.toAddress().toString();
            var addResult = this.selectedUtxos.add(replacementUtxo);
            return addResult;
        }
        catch (err) {
            console.log(err);
            throw new Error("could not replace change output, you will have to refresh utxos");
        }
    };
    // legacy p2pkh spend
    // support paymail script
    // TODO: estimate fee
    Wallet.prototype.makeSimpleSpend = function (satoshis, utxos, payTo, fee, data) {
        if (fee === void 0) { fee = 300; }
        return __awaiter(this, void 0, void 0, function () {
            var filteredUtxos, _a, utxoSatoshis, changeSatoshis, txb;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this._keypair) {
                            throw new Error('Load wallet before spending');
                        }
                        _a = utxos;
                        if (_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getAnUnspentOutput()];
                    case 1:
                        _a = (_b.sent());
                        _b.label = 2;
                    case 2:
                        filteredUtxos = _a;
                        if (!filteredUtxos || filteredUtxos.count < 1) {
                            throw Error("Insufficient wallet funds. Send funds to ".concat(this.keyPair.toAddress().toString()));
                        }
                        utxoSatoshis = filteredUtxos.spendable().satoshis;
                        changeSatoshis = utxoSatoshis - satoshis.toNumber();
                        if (changeSatoshis < 0) {
                            throw Error("the utxo ran out of money ".concat(changeSatoshis));
                        }
                        txb = new TransactionBuilder_1.TransactionBuilder()
                            .from(filteredUtxos.items, this._keypair.pubKey);
                        if (payTo instanceof bsv_1.Script) {
                            txb.addOutputScript(satoshis.toNumber(), payTo);
                        }
                        else {
                            console.log("PAYTO", payTo, satoshis);
                            txb.toAddress(satoshis.toNumber(), payTo ? bsv_1.Address.fromString(payTo) : this._keypair.toAddress());
                        }
                        if (changeSatoshis - fee > 0) {
                            txb = txb.toAddress(changeSatoshis - fee, this._keypair.toAddress());
                        }
                        // change not working
                        // .change(this._keypair.toAddress())
                        if (data) {
                            this.addData(txb, data);
                        }
                        this.lastTx = txb.buildAndSign(this._keypair);
                        return [2 /*return*/, {
                                hex: this.lastTx.toHex(),
                                tx: this.lastTx,
                                txid: txb.txid,
                                utxos: filteredUtxos,
                                txOutMap: txb.txb.uTxOutMap,
                                feeExpected: this.miningFeeExpected(txb),
                                feeActual: txb.miningFee
                            }
                            // tx can be broadcast and put on chain
                        ];
                }
            });
        });
    };
    // the expected mining fee, based on size 
    Wallet.prototype.miningFeeExpected = function (txb) {
        if (!txb)
            return null;
        var size = txb.tx.toString().length;
        //TODO: incorporate reduced fee for op_return
        return Math.ceil(size / 1000 * this.feePerKbNum);
    };
    //tries to load utxos for wallet and
    //throws error if it cannot get any
    Wallet.prototype.tryLoadWalletUtxos = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!this.selectedUtxos.hasAny()) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getAnUnspentOutput()];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        if (!this.selectedUtxos.hasAny() && !this._allowZeroFunding) {
                            throw Error("Wallet ".concat((_a = this._keypair) === null || _a === void 0 ? void 0 : _a.toAddress().toString(), " does not have any unspent outputs!"));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    Wallet.prototype.selectExpandableInputs = function (satoshis, selected, utxos) {
        var filtered = utxos || selected.spendable().filter(satoshis);
        // console.log(`${filtered.satoshis} < ${satoshis.toNumber() + this._dustLimit}`)
        if (filtered.count < this._maxInputs && filtered.satoshis < (satoshis.toNumber() + this._dustLimit)) {
            // add additional utxos
            var additional = this.selectedUtxos.spendable().filter(satoshis.add(this._dustLimit));
            // TODO: make sure filtered includes previous utxos
            filtered.addOutputs(additional);
        }
        return filtered;
    };
    // store data into transaction
    Wallet.prototype.addData = function (txb, data) {
        var script = bsv_1.Script.fromSafeData(data);
        txb.txb.outputToScript(new bsv_1.Bn().fromNumber(0), script);
    };
    // standard method for a streaming wallet
    // payTo should be script, as instance of Script or string
    Wallet.prototype.makeStreamableCashTx = function (satoshis, payTo, makeFuture, utxos, data) {
        if (makeFuture === void 0) { makeFuture = true; }
        return __awaiter(this, void 0, void 0, function () {
            var filteredUtxos, utxoSatoshis, changeSatoshis, txb, dustTotal, runningSpent, index, element, outSatoshis, inputCount, thistx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!utxos) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.tryLoadWalletUtxos()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        filteredUtxos = this.selectExpandableInputs(satoshis, this.selectedUtxos, utxos);
                        this._fundingInputCount = filteredUtxos.count;
                        utxoSatoshis = filteredUtxos.satoshis;
                        changeSatoshis = utxoSatoshis - satoshis.toNumber();
                        if (changeSatoshis < 0) {
                            if (this._allowFundingBelowRequested
                                && (!this._allowZeroFunding && utxoSatoshis > 0)) {
                                if (Math.abs(changeSatoshis) <= this._dustLimit) {
                                    // the deficit was less than dust
                                    // wallet is about to run out of money
                                    // exhaust remaining funds
                                    changeSatoshis = 0;
                                }
                            }
                            else {
                                throw Error("the wallet ran out of money ".concat(this.fundingInputCount, " ").concat(utxoSatoshis, " ").concat(changeSatoshis));
                            }
                        }
                        txb = new TransactionBuilder_1.TransactionBuilder();
                        txb.setChangeAddress(this._keypair.toAddress());
                        dustTotal = filteredUtxos.count * this._dustLimit;
                        runningSpent = satoshis.toNumber();
                        for (index = 0; index < this._fundingInputCount; index++) {
                            element = filteredUtxos.items[index];
                            element.amountSpent = Math.min(element.satoshis, runningSpent);
                            runningSpent -= element.amountSpent;
                            outSatoshis = 0 //this._dustLimit
                            ;
                            if (index === 0) {
                                outSatoshis = Math.max(changeSatoshis, 0);
                            }
                            inputCount = txb.addInput(element, this._keypair.pubKey, index === 0 && outSatoshis > 0 ? this.SIGN_INPUT_CHANGE : this.SIGN_INPUT_NOCHANGE);
                            if (inputCount !== index + 1)
                                throw Error("Input did not get added!");
                            //TODO: need many more unit tests
                            if (outSatoshis > 0) {
                                txb.addOutputAddress(outSatoshis, this._keypair.toAddress());
                            }
                        }
                        //balance goes to payto (string|Script)
                        this.handlePayTo(txb, payTo, satoshis);
                        if (data) {
                            this.addData(txb, data);
                        }
                        thistx = txb.buildAndSign(this._keypair, makeFuture);
                        this.lastTx = thistx;
                        this._senderOutputCount = this.lastTx.txOuts.length;
                        return [2 /*return*/, {
                                hex: this.lastTx.toHex(),
                                tx: this.lastTx,
                                txid: txb.txid,
                                utxos: filteredUtxos,
                                txOutMap: txb.txb.uTxOutMap,
                                funding: this.getTxFund(thistx)
                            }
                            // at this point, tx is spendable by anyone!
                            // only pass it through secure channel to recipient
                        ];
                }
            });
        });
    };
    Wallet.prototype.handlePayTo = function (txb, payTo, satoshis) {
        if (payTo) {
            if (Array.isArray(payTo)) {
                var tot = 0;
                for (var index = 0; index < payTo.length; index++) {
                    var pay = payTo[index];
                    // pay can be one or object to/percent
                    var calculatedAmount = Math.floor(satoshis.toNumber() * pay.percent / 100);
                    tot += calculatedAmount;
                    if (index === payTo.length - 1) {
                        // this gives extra amount to last one listed!
                        calculatedAmount += (satoshis.toNumber() - tot);
                    }
                    txb.addOutputScript(calculatedAmount, pay.to);
                }
            }
            else {
                // just one, pay all to that one script
                txb.addOutputScript(satoshis.toNumber(), payTo);
            }
        }
    };
    // attempt to split utxos, trying to create
    // the targeted number of outputs with at least
    // the minimum number of satoshis in each one
    // on a best effort basis
    // caller must select utxos
    Wallet.prototype.split = function (utxos, targetCount, satoshis) {
        return __awaiter(this, void 0, void 0, function () {
            var minSatoshis, splits, txb, index, split;
            return __generator(this, function (_a) {
                minSatoshis = Math.max(satoshis, this._dustLimit);
                splits = utxos.split(targetCount, minSatoshis);
                //only ones greater than min or dust
                if (splits.utxo.satoshis > 0) {
                    txb = new TransactionBuilder_1.TransactionBuilder();
                    txb.addInput(splits.utxo.firstItem, this._keypair.pubKey);
                    for (index = 0; index < splits.breakdown.items.length; index++) {
                        split = splits.breakdown.items[index];
                        txb.addOutputAddress(split.satoshis, this._keypair.toAddress());
                    }
                    console.log(splits.breakdown);
                    this.lastTx = txb.buildAndSign(this._keypair);
                    return [2 /*return*/, {
                            hex: this.lastTx.toHex(),
                            tx: this.lastTx,
                            utxos: splits.utxo
                        }];
                }
                return [2 /*return*/];
            });
        });
    };
    //TODO: following utility type funcs can go elsewhere
    Wallet.prototype.countOutputs = function (tx) {
        var _a;
        var cnt = 0;
        for (var index = 0; index < tx.txOuts.length; index++) {
            var txout = tx.txOuts[index];
            if (!((_a = txout.script) === null || _a === void 0 ? void 0 : _a.isSafeDataOut())) {
                cnt++;
            }
        }
        return cnt;
    };
    Wallet.prototype.filteredOutputs = function (tx) {
        var _a;
        var result = [];
        for (var index = 0; index < tx.txOuts.length; index++) {
            var txout = tx.txOuts[index];
            if (!((_a = txout.script) === null || _a === void 0 ? void 0 : _a.isSafeDataOut())) {
                result.push(txout);
            }
        }
        return result;
    };
    //when you know wallet has received a new
    //funding amount (i.e. moneybutton onPayment)
    //then add utxo here so wallet can spend it
    //saves time from having to get it from index service
    //requires: satoshis, script, txid, index
    //optional: payment.rawhex
    Wallet.prototype.addUnspent = function (payment) {
        if (payment) {
            // TODO: makes assumptions, buggy
            // could get this info from payment.rawhex?
            var unspent = new UnspentOutput_1.UnspentOutput(payment.satoshis, this.keyPair.toOutputScript(), payment.txid, 0 // assumption! TODO: decode rawhex and validate
            );
            this.selectedUtxos.add_conditional(unspent);
        }
    };
    return Wallet;
}());
exports.Wallet = Wallet;
//# sourceMappingURL=Wallet.js.map