import NodeCache from 'node-cache';
import logger from './logger';
import { getCurrentBlockHeight, getMinimumBondInRune, getAllNodes, getNodeBondInfo } from './thornodeClient';
import { NodeBondProvider, NodesResponse } from '@xchainjs/xchain-thornode';

interface BondInfo {
  bond: number;
  isBondProvider: boolean;
}

class GenericCache {
  private static instance: GenericCache;
  private cache: NodeCache;
  private readonly TTLs = {
    BLOCK_HEIGHT: 3, // 3 seconds
    MINIMUM_BOND: 60, // 60 seconds
    NODES: 30, // 30 seconds
    NODE_BOND_INFO: 2 * 60, // 30 seconds
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

  public async getNodeBondInfo(nodeAddress: string): Promise<NodeBondProvider[]> {
    const cacheKey = `nodeBond:${nodeAddress}`;
    return this.get<NodeBondProvider[]>(
      cacheKey,
      () => getNodeBondInfo(nodeAddress),
      this.TTLs.NODE_BOND_INFO
    );
  }

  public async getBondInfo(nodeAddress: string, userAddress: string): Promise<BondInfo> {
    const nodeBondInfo = await this.getNodeBondInfo(nodeAddress);
    const provider = nodeBondInfo.find(
      bp => bp.bond_address === userAddress
    );

    return {
      isBondProvider: !!provider,
      bond: provider ? Number(provider.bond) : 0
    };
  }

  public invalidateCache(): void {
    this.cache.flushAll();
    logger.info('Cache invalidated');
  }

  public invalidateKey(key: string): void {
    this.cache.del(key);
    logger.info(`Cache invalidated for key: ${key}`);
  }

  public invalidateBondCacheForNode(nodeAddress: string): void {
    const cacheKey = `nodeBond:${nodeAddress}`;
    this.cache.del(cacheKey);
    logger.info(`Bond info cache invalidated for node ${nodeAddress}`);
  }
}

export const genericCache = GenericCache.getInstance(); 