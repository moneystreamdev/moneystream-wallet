"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TxPointer_1 = require("../../src/TxPointer");
describe('txpointer tests', function () {
    it('instantiates txpointer', function () {
        var pointer = new TxPointer_1.TxPointer('abc', 0);
        expect(pointer).toBeInstanceOf(TxPointer_1.TxPointer);
    });
    it('outputs to string', function () {
        var pointer = new TxPointer_1.TxPointer('abc', 0);
        expect(pointer.toString()).toBe("abc.0");
    });
});
//# sourceMappingURL=txpointer.test.js.map