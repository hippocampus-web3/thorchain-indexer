import { Request, Response } from 'express';
import { AppDataSourceApi } from '../../data-source';
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

      // Get all bonded whitelist requests for these nodes
      const nodeAddresses = nodes.map(node => node.nodeAddress);
      const whitelistRequests = await AppDataSourceApi.getRepository(WhitelistRequest)
        .createQueryBuilder('request')
        .where('request.nodeAddress IN (:...nodeAddresses)', { nodeAddresses })
        .andWhere('request.status = :status', { status: 'bonded' })
        .getMany();

      // Calculate total delegated amount for each node
      const delegatedAmounts = whitelistRequests.reduce((acc, request) => {
        if (!acc[request.nodeAddress]) {
          acc[request.nodeAddress] = 0;
        }
        acc[request.nodeAddress] = Number(acc[request.nodeAddress]) + Number(request.realBond);
        return acc;
      }, {} as Record<string, number>);
      
      // Adjust maxRune for each node
      const adjustedNodes = nodes.map(node => ({
        ...node,
        maxRune: node.maxRune - (delegatedAmounts[node.nodeAddress] || 0)
      }));

      return res.json({
        data: populateNodesWithNetworkInfo(adjustedNodes, officialNodeInfo, currentBlockHeight, minimumBondInRune),
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

  getNodeByAddress = async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const node = await AppDataSourceApi.getRepository(NodeListing).findOne({
        where: { nodeAddress: address }
      });

      if (!node) {
        return res.status(404).json({ error: 'Node not found' });
      }

      // Get bonded whitelist requests for this node
      const whitelistRequests = await AppDataSourceApi.getRepository(WhitelistRequest)
        .createQueryBuilder('request')
        .where('request.nodeAddress = :address', { address })
        .andWhere('request.status = :status', { status: 'bonded' })
        .getMany();

      // Calculate total delegated amount
      const totalDelegated = whitelistRequests.reduce((sum, request) => 
        sum + request.realBond, 0);

      // Adjust maxRune
      const adjustedNode = {
        ...node,
        maxRune: node.maxRune - totalDelegated
      };

      return res.json(adjustedNode);
    } catch (error) {
      logger.error('Error getting node:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
} 