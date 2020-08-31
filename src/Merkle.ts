import { MerkleTree } from 'merkletreejs'
import SHA256 from 'crypto-js/sha256'

// Handle hashing of data into merkle tree
export class Merkle {
    // hash a json object
    hash(json:any) : Buffer {
        const flat = this.flattenToArray(json)
        const leaves = flat.map(x => SHA256(x))
        const tree = new MerkleTree(
            leaves,
            SHA256,
            {isBitcoinTree:true}
        )
        return tree.getRoot()
    }

    flattenToArray (json:any):Array<any> {
        return Object.keys(json).reduce((acc:any,key) => {
            acc.push(key)
            if (typeof json[key] === 'object') {
                acc = acc.concat(this.flattenToArray(json[key]))
            }
            else {
                acc.push(json[key])
            }
            return acc
        },[])
    }

}