import { Request, Response } from "express";
import { AppDataSourceApi } from "../../data-source-api";
import { WhitelistRequest } from "../../entities/WhitelistRequest";
import { WhitelistDTO } from "../types/WhitelistDTO";
import logger from "../../utils/logger";
import { populateNodesWithNetworkInfo } from "../helpers/populateNodes";
import { genericCache } from '../../utils/genericCache';

export class WhitelistController {
  getWhitelistRequests =  async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 80, address, nodeAddress } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const queryBuilder = AppDataSourceApi.getRepository(WhitelistRequest)
        .createQueryBuilder("whitelist")
        .leftJoinAndSelect("whitelist.node", "node");

      // If nodeAddress is provided, search for specific request
      if (nodeAddress) {
        if (!address) {
          return res.status(400).json({ 
            error: "User address is required when searching by node address" 
          });
        }

        const request = await queryBuilder
          .where("whitelist.userAddress = :address", { address })
          .andWhere("whitelist.nodeAddress = :nodeAddress", { nodeAddress })
          .getOne();

        if (!request) {
          return res.status(404).json({ error: "Whitelist request not found" });
        }

        // Get network info for the node
        const officialNodeInfo = await genericCache.getNodes();
        const currentBlockHeight = await genericCache.getBlockHeight();
        const minimumBondInRune = await genericCache.getMinimumBond();

        // Populate node with network info
        const populatedNodes = populateNodesWithNetworkInfo(
          [request.node], 
          officialNodeInfo, 
          currentBlockHeight, 
          minimumBondInRune
        );
        request.node = populatedNodes[0];

        return res.json({
          data: [request],
          pagination: {
            total: 1,
            page: 1,
            limit: 1,
            totalPages: 1,
          },
        });
      }

      // Otherwise, handle general query with address filter
      if (!address) {
        return res
          .status(400)
          .json({ error: "User address is required" });
      }

      queryBuilder.where(
        "(node.operatorAddress = :address OR whitelist.userAddress = :address)",
        { address }
      );

      const total = await queryBuilder.getCount();

      const requests = await queryBuilder
        .orderBy("whitelist.timestamp", "DESC")
        .skip(skip)
        .take(Number(limit))
        .getMany();

      const officialNodeInfo = await genericCache.getNodes();
      const currentBlockHeight = await genericCache.getBlockHeight();
      const minimumBondInRune = await genericCache.getMinimumBond();

      // Populate nodes with network info
      const finalRequests: WhitelistDTO[] = requests.map(request => {
        const populatedNodes = populateNodesWithNetworkInfo([request.node], officialNodeInfo, currentBlockHeight, minimumBondInRune);
        request.node = populatedNodes[0];
        return request;
      });

      return res.json({
        data: finalRequests,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error("Error getting whitelist requests:", error);
      return res
        .status(500)
        .json({ error: "Error getting whitelist requests" });
    }
  }

  getWhitelistRequestById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const request = await AppDataSourceApi.getRepository(
        WhitelistRequest
      ).findOne({
        where: { id: Number(id) },
        relations: ["node"],
      });

      if (!request) {
        return res.status(404).json({ error: "Whitelist request not found" });
      }

      return res.json(request);
    } catch (error) {
      logger.error("Error getting whitelist request:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}
