import { NodeListing } from '../entities/NodeListing';
import logger from './logger';
import { getAllNodes } from '../thornodeClient';

class NodeCache {
  private static instance: NodeCache;
  private nodes: NodeListing[] = [];
  private lastUpdate: number = 0;
  private readonly CACHE_TTL = 0.5 * 60 * 1000;

  private constructor() {}

  public static getInstance(): NodeCache {
    if (!NodeCache.instance) {
      NodeCache.instance = new NodeCache();
    }
    return NodeCache.instance;
  }

  public async getNodes(): Promise<any[]> {
    const now = Date.now();
    
    // Si el caché está vacío o ha expirado, actualizamos
    if (this.nodes.length === 0 || now - this.lastUpdate > this.CACHE_TTL) {
      try {
        this.nodes = await getAllNodes();
        this.lastUpdate = now;
        logger.info('Caché de nodos actualizado');
      } catch (error) {
        logger.error('Error al actualizar el caché de nodos:', error);
        // Si hay error, devolvemos el caché anterior si existe
        if (this.nodes.length === 0) {
          throw error;
        }
      }
    }

    return this.nodes;
  }

  public invalidateCache(): void {
    this.nodes = [];
    this.lastUpdate = 0;
    logger.info('Caché de nodos invalidado');
  }
}

export const nodeCache = NodeCache.getInstance(); 