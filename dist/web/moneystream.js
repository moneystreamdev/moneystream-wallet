"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexingService = exports.KeyPair = exports.Wallet = void 0;
require("core-js/stable");
require("regenerator-runtime/runtime");
var Wallet_1 = require("../src/Wallet");
Object.defineProperty(exports, "Wallet", { enumerable: true, get: function () { return Wallet_1.Wallet; } });
var KeyPair_1 = require("../src/KeyPair");
Object.defineProperty(exports, "KeyPair", { enumerable: true, get: function () { return KeyPair_1.KeyPair; } });
var IndexingService_1 = __importDefault(require("../src/IndexingService"));
Object.defineProperty(exports, "IndexingService", { enumerable: true, get: function () { return IndexingService_1.default; } });
window.MoneyStream = { Wallet: Wallet_1.Wallet, KeyPair: KeyPair_1.KeyPair, IndexingService: IndexingService_1.default };
//# sourceMappingURL=moneystream.js.map