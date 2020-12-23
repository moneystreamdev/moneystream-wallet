import { Hash, Aescbc } from '../../dist/src/index'

describe('import', () => {
    it('exports', () => {
        console.log(Hash)
        console.log(Aescbc)
        expect(Hash.name).toBe('Hash')
        expect(Aescbc.name).toBe('Aescbc')
    })
})
