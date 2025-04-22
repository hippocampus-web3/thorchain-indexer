import { Request, Response } from 'express';
import { AppDataSourceApi } from '../../data-source-api';
import { NodeListing } from '../../entities/NodeListing';
import { WhitelistRequest } from '../../entities/WhitelistRequest';
import logger from '../../utils/logger';
import { genericCache } from '../../utils/genericCache';
import { populateNodesWithNetworkInfo } from '../helpers/populateNodes';
import { NodesResponse } from '@xchainjs/xchain-thornode';

export class NodeController {

  getNodes = async (req: Request, res: Response) => {
    try {
      const officialNodeInfo: NodesResponse = await genericCache.getNodes();
      const currentBlockHeight: number = await genericCache.getBlockHeight();
      const minimumBondInRune: number = await genericCache.getMinimumBond();

      const { page = 1, limit = 80, operatorAddress } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const queryBuilder = AppDataSourceApi.getRepository(NodeListing).createQueryBuilder('node');

      if (operatorAddress) {
        queryBuilder.andWhere('node.operatorAddress = :operatorAddress', { operatorAddress });
      }

      const total = await queryBuilder.getCount();

      const nodes = await queryBuilder
        .orderBy('node.timestamp', 'DESC')
        .skip(skip)
        .take(Number(limit))
        .getMany();

      return res.json({
        data: populateNodesWithNetworkInfo(nodes, officialNodeInfo, currentBlockHeight, minimumBondInRune),
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Error getting nodes:', error);
      return res.status(500).json({ error: 'Error getting nodes' });
    }
  }
} 