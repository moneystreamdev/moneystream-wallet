"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUtxos = exports.someHashBufString = exports.testKeyPair = void 0;
var OutputCollection_1 = require("../../src/OutputCollection");
var UnspentOutput_1 = require("../../src/UnspentOutput");
var KeyPair_1 = require("../../src/KeyPair");
exports.testKeyPair = new KeyPair_1.KeyPair().fromRandom();
exports.someHashBufString = '1aebb7d0776cec663cbbdd87f200bf15406adb0ef91916d102bcd7f86c86934e';
function createUtxos(count, satoshis) {
    var lotsOfUtxos = new OutputCollection_1.OutputCollection();
    for (var index = 0; index < count; index++) {
        var testUtxo = new UnspentOutput_1.UnspentOutput(satoshis, exports.testKeyPair.toOutputScript(), exports.someHashBufString, index);
        lotsOfUtxos.add(testUtxo);
    }
    return lotsOfUtxos;
}
exports.createUtxos = createUtxos;
//# sourceMappingURL=testutils.js.map