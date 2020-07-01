import { TxPointer } from "../../src/TxPointer"

describe('txpointer tests', () => {
    it('instantiates txpointer', () => {
        const pointer = new TxPointer('abc',0)
        expect(pointer).toBeInstanceOf(TxPointer)
    })
    it('outputs to string', () => {
        const pointer = new TxPointer('abc',0)
        expect(pointer.toString()).toBe(`abc.0`)
    })
})