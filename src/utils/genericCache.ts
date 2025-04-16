import NodeCache from 'node-cache';
import logger from './logger';
import { getCurrentBlockHeight, getMinimumBondInRune, getAllNodes } from './thornodeClient';
import { NodesResponse } from '@xchainjs/xchain-thornode';

class GenericCache {
  private static instance: GenericCache;
  private cache: NodeCache;
  private readonly TTLs = {
    BLOCK_HEIGHT: 3, // 3 seconds
    MINIMUM_BOND: 60, // 60 seconds
    NODES: 30, // 30 seconds
  };
  private readonly DEFAULT_TTL = 30; // 30 seconds

  private constructor() {
    this.cache = new NodeCache();
  }

  public static getInstance(): GenericCache {
    if (!GenericCache.instance) {
      GenericCache.instance = new GenericCache();
    }
    return GenericCache.instance;
  }

  public async get<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T> {
    const cachedValue = this.cache.get<T>(key);
    
    if (cachedValue === undefined) {
      try {
        const value = await fetchFn();
        this.cache.set(key, value, ttl || this.DEFAULT_TTL);
        logger.info(`Cache updated for key: ${key}`);
        return value;
      } catch (error) {
        logger.error(`Error updating cache for key ${key}:`, error);
        throw error;
      }
    }

    return cachedValue;
  }

  public async getBlockHeight(): Promise<number> {
    return this.get<number>('blockHeight', getCurrentBlockHeight, this.TTLs.BLOCK_HEIGHT);
  }

  public async getMinimumBond(): Promise<number> {
    return this.get<number>('minimumBond', getMinimumBondInRune, this.TTLs.MINIMUM_BOND);
  }

  public async getNodes(): Promise<NodesResponse> {
    return this.get<NodesResponse>('nodes', getAllNodes, this.TTLs.NODES);
  }

  public invalidateCache(): void {
    this.cache.flushAll();
    logger.info('Cache invalidated');
  }

  public invalidateKey(key: string): void {
    this.cache.del(key);
    logger.info(`Cache invalidated for key: ${key}`);
  }
}

export const genericCache = GenericCache.getInstance(); 