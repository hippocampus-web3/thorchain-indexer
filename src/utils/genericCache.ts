import NodeCache from 'node-cache';
import logger from './logger';
import { getCurrentBlockHeight, getMinimumBondInRune, getAllNodes } from './thornodeClient';
import { NodesResponse } from '@xchainjs/xchain-thornode';
import { MidgardClient } from './midgardClient';

interface BondInfo {
  bond: number;
  isBondProvider: boolean;
}

class GenericCache {
  private static instance: GenericCache;
  private cache: NodeCache;
  private readonly TTLs = {
    BLOCK_HEIGHT: 3, // 3 seconds
    MINIMUM_BOND: 60 * 60, // 1 hour
    NODES: 60, // 60 seconds
    NODE_BOND_INFO: 2 * 60, // 120 seconds
    NETWORK_INFO: 30 * 60, // 30 minutes
  };
  private readonly DEFAULT_TTL = 30; // 30 seconds
  private midgardClient: MidgardClient;

  private constructor() {
    this.cache = new NodeCache();
    this.midgardClient = new MidgardClient();
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

  public async getNodes(height?: number): Promise<NodesResponse> {
    const cacheKey = height ? `nodes:${height}` : 'nodes';
    return this.get<NodesResponse>(cacheKey, () => getAllNodes(height), this.TTLs.NODES);
  }

  public async getBondInfo(nodeAddress: string, userAddress: string): Promise<BondInfo> {
    const nodes = await this.getNodes();
    const node = nodes.find(on => on.node_address === nodeAddress)
    if (!node) {
      throw new Error(`Node ${nodeAddress} not found`);
    }
    const provider = node?.bond_providers?.providers.find(
      bp => bp.bond_address === userAddress
    );

    return {
      isBondProvider: !!provider,
      bond: provider ? Number(provider.bond) : 0
    };
  }

  public async getNetworkInfo() {
    return this.get('networkInfo', () => this.midgardClient.getNetworkInfo(), this.TTLs.NETWORK_INFO);
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