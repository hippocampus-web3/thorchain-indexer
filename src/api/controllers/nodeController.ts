import { Request, Response } from 'express';
import { AppDataSourceApi } from '../../data-source';
import { NodeListing } from '../../entities/NodeListing';
import logger from '../../utils/logger';
import { nodeCache } from '../../utils/nodeCache';
import { getCurrentBlockHeight } from '../../thornodeClient';

export class NodeController {

  getNodes = async (req: Request, res: Response) => {
    try {

      const officialNodeInfo: any[] = await nodeCache.getNodes();
      const currentBlockHeight: number = await getCurrentBlockHeight();

      const { page = 1, limit = 10, operatorAddress } = req.query;
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
        data: this.populateNodesWithNetworkInfo(nodes, officialNodeInfo, currentBlockHeight),
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

      return res.json(node);
    } catch (error) {
      logger.error('Error getting node:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  populateNodesWithNetworkInfo = (nodes: NodeListing[], officialNodes: any[], currentBlockHeight: number) => {
    const nodesWithNetworkInfo = nodes.map(node => {
      const officialNode = officialNodes.find(on => on.node_address === node.nodeAddress && on.node_operator_address === node.operatorAddress);
      if (!officialNode) {
        logger.error(`Node not found in official nodes: ${node.nodeAddress} ${node.operatorAddress}`);
        throw new Error(`Node not found in official nodes: ${node.nodeAddress} ${node.operatorAddress}`);
      }
      return {
        ...node,
        status: officialNode?.status,
        slashPoints: officialNode?.slash_points,
        activeTime: this.computeActiveTimeInSeconds(officialNode?.status_since, currentBlockHeight),
        bondProvidersCount: officialNode?.bond_providers.providers.length
      };
    });
    return nodesWithNetworkInfo
  }

  computeActiveTimeInSeconds = (activeTime: number, currentBlockHeight: number) => {
    return (currentBlockHeight - activeTime) * 6
  }
} 