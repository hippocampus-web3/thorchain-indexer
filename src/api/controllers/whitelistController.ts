import { Request, Response } from "express";
import { AppDataSourceApi } from "../../data-source";
import { WhitelistRequest } from "../../entities/WhitelistRequest";
import logger from "../../utils/logger";
import { bondCache } from "../../utils/bondCache";

export class WhitelistController {
  getWhitelistRequests =  async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, address } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      if (!address) {
        return res
          .status(400)
          .json({ error: "Node address or user address is required" });
      }

      // TODO: Review corner case node provider with user requests to other nodes (makes sense ?)
      const queryBuilder = AppDataSourceApi.getRepository(WhitelistRequest)
        .createQueryBuilder("whitelist")
        .leftJoinAndSelect("whitelist.node", "node")
        .where(
          "(node.operatorAddress = :address OR whitelist.userAddress = :address)",
          { address }
        );

      const total = await queryBuilder.getCount();

      const requests = await queryBuilder
        .orderBy("whitelist.timestamp", "DESC")
        .skip(skip)
        .take(Number(limit))
        .getMany();

      // TODO: Find optimal point between parallel requests and rate limits. Right now it's not parallel
      const finalRequests = [];
      for (const request of requests) {
        const requestWithStatusAndBond = await this.computeWhitelistStatusAndBond(request);
        finalRequests.push(requestWithStatusAndBond);
      }

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

  computeWhitelistStatusAndBond = async (request: WhitelistRequest) => {
    const bondInfo = await bondCache.getBondInfo(
      request.nodeAddress,
      request.userAddress
    );

    let status: "pending" | "approved" | "rejected" | "bonded" = "pending";

    if (bondInfo.isBondProvider) {
      status = "approved";
    }
    if (bondInfo.isBondProvider && bondInfo.bond > 0) {
      status = "bonded";
    }

    return {
      ...request,
      realBond: bondInfo.bond,
      status
    };
  }
}
