"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var OutputCollection_1 = require("../../src/OutputCollection");
var src_1 = require("../../src");
describe('output collection tests', function () {
    it('should break up a utxo', function () {
        var utxos = new OutputCollection_1.OutputCollection();
        utxos.add(new src_1.UnspentOutput(10000, ''));
        var splits = utxos.split(10, 1000);
        expect(splits.breakdown.count()).toBe(10);
    });
    it('should not break up an empty utxo', function () {
        var utxos = new OutputCollection_1.OutputCollection();
        var splits = utxos.split(10, 1000);
        expect(splits.breakdown.count()).toBe(0);
    });
});
//# sourceMappingURL=outputcollection.test.js.map