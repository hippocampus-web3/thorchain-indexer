import { getBondInfoForUser } from '../thornodeClient';
import logger from './logger';

interface BondInfo {
  bond: number;
  isBondProvider: boolean;
}

class BondProviderInfoCache {
  private static instance: BondProviderInfoCache;
  private cache: Map<string, { data: BondInfo; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 0.5 * 60 * 1000; // 5 minutos en milisegundos

  private constructor() {}

  public static getInstance(): BondProviderInfoCache {
    if (!BondProviderInfoCache.instance) {
      BondProviderInfoCache.instance = new BondProviderInfoCache();
    }
    return BondProviderInfoCache.instance;
  }

  private getCacheKey(nodeAddress: string, userAddress: string): string {
    return `${nodeAddress}:${userAddress}`;
  }

  public async getBondInfo(nodeAddress: string, userAddress: string): Promise<BondInfo> {
    const cacheKey = this.getCacheKey(nodeAddress, userAddress);
    const now = Date.now();
    const cachedData = this.cache.get(cacheKey);

    if (cachedData && now - cachedData.timestamp < this.CACHE_TTL) {
      return cachedData.data;
    }

    try {
      const bondInfo = await getBondInfoForUser(nodeAddress, userAddress);
      this.cache.set(cacheKey, {
        data: bondInfo,
        timestamp: now
      });
      logger.info(`Caché de bono actualizado para ${nodeAddress}:${userAddress}`);
      return bondInfo;
    } catch (error) {
      logger.error('Error al actualizar el caché de bono:', error);
      // Si hay error y tenemos datos en caché, devolvemos los datos antiguos
      if (cachedData) {
        return cachedData.data;
      }
      throw error;
    }
  }

  public invalidateCache(): void {
    this.cache.clear();
    logger.info('Caché de bonos invalidado');
  }

  public invalidateCacheForNode(nodeAddress: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(nodeAddress)) {
        this.cache.delete(key);
      }
    }
    logger.info(`Caché de bonos invalidado para nodo ${nodeAddress}`);
  }
}

export const bondCache = BondProviderInfoCache.getInstance(); 