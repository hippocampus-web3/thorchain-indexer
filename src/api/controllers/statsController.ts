import { Request, Response } from 'express';
import { AppDataSourceApi } from '../../data-source-api';
import { NodeListing } from '../../entities/NodeListing';
import { WhitelistRequest } from '../../entities/WhitelistRequest';
import { genericCache } from '../../utils/genericCache';

export class StatsController {
  async getStats(req: Request, res: Response) {
    try {
      const nodeRepository = AppDataSourceApi.getRepository(NodeListing);
      const whitelistRepository = AppDataSourceApi.getRepository(WhitelistRequest); // Get local database stats
      const totalNodes = await nodeRepository.count();
      const completedWhitelists = await whitelistRepository.count({
        where: { status: 'bonded' }
      });
      const totalBondRune = await whitelistRepository
        .createQueryBuilder('whitelist')
        .select('SUM(whitelist.realBond)', 'totalRealBond')
        .where('whitelist.status = :status', { status: 'bonded' })
        .getRawOne();

      // Get network stats from Midgard
      const networkInfo = await genericCache.getNetworkInfo();

      res.json({
        totalNodes,
        completedWhitelists,
        totalBondRune: totalBondRune?.totalRealBond || 0,
        networkStats: {
          bondingAPY: networkInfo.bondingAPY,
        }
      });

    } catch (error) {
      console.error('Error getting stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
 