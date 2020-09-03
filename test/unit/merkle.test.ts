import {Merkle} from '../../src/Merkle'

const sessionContext = {
    "session":"abc-123",
    "txid":"deadbeef",
    "site":"bitcoinofthings.com",
    "amount": 0
}

describe('Merkle tests', () => {
    it('should flatten simple', () => {
        const m = new Merkle()
        const flat = m.flattenToArray({'a':'b','c':'d'})
        expect(flat).toBeInstanceOf(Array)
        expect(flat.length).toBe(4)
        expect(flat[0]).toBe('a')
        expect(flat[1]).toBe('b')
        expect(flat[2]).toBe('c')
        expect(flat[3]).toBe('d')
    })
    it('should flatten nested', () => {
        const m = new Merkle()
        const flat = m.flattenToArray({'a':{'b':'c'}})
        expect(flat).toBeInstanceOf(Array)
        expect(flat.length).toBe(3)
        expect(flat[0]).toBe('a')
        expect(flat[1]).toBe('b')
        expect(flat[2]).toBe('c')
    })
    it('should merkle json', () => {
        const m = new Merkle()
        const h = m.hash(sessionContext)
        expect(h).toBeInstanceOf(Buffer)
        expect(h?.toString('hex'))
            .toBe("ecb02ef91479fd8ef0ef7f3c83ce2642bdd2341dbdd846d5c6a061157eddbf0a")
        sessionContext.amount = 99
        const h2 = m.hash(sessionContext)
        expect(h?.toString()).not.toBe(h2?.toString())
    })
    it('should merkle null', () => {
        const m = new Merkle()
        const h = m.hash(null)
        expect(h).toBe(null)
    })
})