//these can only be run when bsv2
// is installed in node_modules
import { KeyPair } from '../../src/KeyPair'
import { PrivKey as PrivateKey,
  PubKey as PublicKey
} from 'bsv'

describe('Instantiate KeyPair', () => {
  it('should instantiate a keypair object', () => {
    const k = new KeyPair()
    expect(k).toBeInstanceOf(KeyPair)
  })
  it('should generate random keypair', () => {
    const k = new KeyPair().fromRandom()
    expect(k).toBeInstanceOf(KeyPair)
    expect(k.privKey).toBeInstanceOf(PrivateKey)
    expect(k.pubKey).toBeInstanceOf(PublicKey)
  })
  it('should generate keypair from wif', () => {
    const k = new KeyPair().fromRandom()
    const wif = k.toWif()
    const k2 = new KeyPair().fromWif(wif)
    expect (k2.toWif()).toBe(wif)
  })
  it('should make address script', () => {
    const k = new KeyPair().fromRandom()
    expect (k.toOutputScript().isPubKeyHashOut()).toBe(true)
  })
  
})
