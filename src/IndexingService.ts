// api methods for calling index service
import { portableFetch } from './utils/portableFetch'

export interface IIndexingService {
    getApiTxJSON(txhash:string):any
    getUtxosAPI(address:any):any
    broadcastRaw(hex:string):any
}

export default class IndexingService implements IIndexingService {
    async getApiTxJSON(txhash:string) {
        const url = `https://api.whatsonchain.com/v1/bsv/main/tx/hash/${txhash}`
        const response = await portableFetch(url)
        return response.json()
    }

        //address object
        async getUtxosAPI(address:any) {
            const url = `https://api.whatsonchain.com/v1/bsv/main/address/${address.toString()}/unspent`
            const response = await portableFetch(url)
            return response.json()
        }
    
        async broadcastRaw(txhex: string) {
            const url = 'https://api.whatsonchain.com/v1/bsv/main/tx/raw'
            const data = {
                "txhex": txhex
            }
            const body = JSON.stringify(data);
            const broadcast = await portableFetch(url, 
                {
                    method: "POST", 
                    headers: { 'Content-Type': 'application/json' },
                    body:body
                }
            )
            return broadcast.json()
        }
    
}