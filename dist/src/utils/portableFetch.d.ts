/**
 * Works in browser (including firefox/chrome extensions) and node
 * Don't use @types/node-fetch as we want to set credentials/cache
 * settings.
 */
export declare function portableFetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
//# sourceMappingURL=portableFetch.d.ts.map