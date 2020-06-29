export interface IIndexingService {
    getApiTxJSON(txhash: string): any;
    getUtxosAPI(address: any): any;
    broadcastRaw(hex: string): any;
}
export default class IndexingService implements IIndexingService {
    getApiTxJSON(txhash: string): Promise<any>;
    getUtxosAPI(address: any): Promise<any>;
    broadcastRaw(txhex: string): Promise<any>;
}
//# sourceMappingURL=IndexingService.d.ts.map