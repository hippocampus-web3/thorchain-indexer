import { Request, Response } from 'express';
import { AppDataSource } from '../../data-source';
import { WhitelistRequest } from '../../entities/WhitelistRequest';
import logger from '../../utils/logger';

export class WhitelistController {
  async getWhitelistRequests(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, nodeAddress } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const queryBuilder = AppDataSource.getRepository(WhitelistRequest)
        .createQueryBuilder('whitelist')
        .leftJoinAndSelect('whitelist.node', 'node');

      if (nodeAddress) {
        queryBuilder.andWhere('node.nodeAddress = :nodeAddress', { nodeAddress });
      }

      const total = await queryBuilder.getCount();

      const requests = await queryBuilder
        .orderBy('whitelist.timestamp', 'DESC')
        .skip(skip)
        .take(Number(limit))
        .getMany();

      return res.json({
        data: requests,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Error getting whitelist requests:', error);
      return res.status(500).json({ error: 'Error getting whitelist requests' });
    }
  }

  async getWhitelistRequestById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const request = await AppDataSource.getRepository(WhitelistRequest).findOne({
        where: { id: Number(id) },
        relations: ['node']
      });

      if (!request) {
        return res.status(404).json({ error: 'Whitelist request not found' });
      }

      return res.json(request);
    } catch (error) {
      logger.error('Error getting whitelist request:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
} 