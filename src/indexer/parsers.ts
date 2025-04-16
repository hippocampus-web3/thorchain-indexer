import { MidgardAction } from '../types';
import logger from '../utils/logger';
import { DatabaseManager } from '../db';
import { genericCache } from '../utils/genericCache';
import { announceNewNode, announceNewWhitelistRequest } from '../third-party-services/twitter';
import { NodeListing } from '../entities/NodeListing';
import { WhitelistRequest } from '../entities/WhitelistRequest';

export interface ParserResult {
  [key: string]: any;
}

export const parsers = {
  nodeListing: async (action: MidgardAction, dbManager: DatabaseManager): Promise<ParserResult> => {
    const memo = action.metadata.send.memo;

    const parts = memo.split(':');
    if (parts.length !== 7) {
      throw new Error(`Invalid memo format for node listing: ${memo}`);
    }

    const nodeAddress = parts[2]
    const operatorAddress = parts[3]

    if (operatorAddress !== action.in[0]?.address) {
      logger.warn(`Node list request rejected: Impersonated node operator ${operatorAddress}`);
      throw new Error(`Impersonated node operator ${nodeAddress}`);
    }

    const nodeListingRepo = dbManager.getRepository('node_listings');
    
    const existingNode = await nodeListingRepo.findOne({ 
        where: { nodeAddress } 
    }) as NodeListing | null;

    if (existingNode) {
        logger.info(`Updating existing node listing for address ${nodeAddress}`);
        Object.assign(existingNode, {
            operatorAddress,
            minRune: Number(parts[4]),
            maxRune: Number(parts[5]),
            feePercentage: Number(parts[6]),
            txId: action.in[0].txID,
            height: action.height,
            timestamp: new Date(Math.floor(Number(action.date) / 1000000))
        });
        return existingNode;
    }

    const oficialNodes = await genericCache.getNodes();
    const officialNodeInfo = oficialNodes.find(on => on.node_address === nodeAddress && on.node_operator_address === operatorAddress)

    if (!officialNodeInfo) {
      logger.warn(`Node list request: Node and node operator mismatch ${nodeAddress} ${operatorAddress}`);
      throw new Error(`Node list request: Node and node operator mismatch ${nodeAddress} ${operatorAddress}`);
    }

    const nodeListing = new NodeListing();
    nodeListing.nodeAddress = nodeAddress;
    nodeListing.operatorAddress = operatorAddress;
    nodeListing.minRune = Number(parts[4]);
    nodeListing.maxRune = Number(parts[5]);
    nodeListing.feePercentage = Number(parts[6]);
    nodeListing.txId = action.in[0]?.txID;
    nodeListing.height = action.height;
    nodeListing.timestamp = new Date(Math.floor(Number(action.date) / 1000000));

    // Announce new node on Twitter
    try {
      await announceNewNode(nodeListing);
      logger.info(`Successfully announced new node ${nodeAddress} on Twitter`);
    } catch (error) {
      logger.error(`Failed to announce new node ${nodeAddress} on Twitter:`, error);
    }

    return nodeListing;
  },
  whitelistRequest: async (action: MidgardAction, dbManager: DatabaseManager) => {
    const memo = action.metadata.send.memo;

    const parts = memo.split(':');
    if (parts.length !== 5) {
      throw new Error(`Invalid memo format for node listing: ${memo}`);
    }

    const userAddress = parts[3]
    const nodeAddress = parts[2]

    if (userAddress !== action.in[0]?.address) {
        logger.warn(`Whitelist request rejected: Impersonated address ${userAddress}`);
        throw new Error(`Impersonated address ${userAddress}`);
    }

    const nodeListingRepo = dbManager.getRepository('node_listings');
    const node = await nodeListingRepo.findOne({ where: { nodeAddress } }) as NodeListing | null;
    
    if (!node) {
        logger.warn(`Whitelist request rejected: Node ${nodeAddress} does not exist`);
        throw new Error(`Node ${nodeAddress} does not exist`);
    }

    const whitelistRequest = new WhitelistRequest();
    whitelistRequest.nodeAddress = nodeAddress;
    whitelistRequest.userAddress = userAddress;
    whitelistRequest.intendedBondAmount = parseInt(parts[4]);
    whitelistRequest.txId = action.in[0].txID;
    whitelistRequest.height = action.height;
    whitelistRequest.timestamp = new Date(Math.floor(Number(action.date) / 1000000));

    // Announce new whitelist request on Twitter
    try {
      await announceNewWhitelistRequest(whitelistRequest);
      logger.info(`Successfully announced new whitelist request for user ${userAddress} on Twitter`);
    } catch (error) {
      logger.error(`Failed to announce new whitelist request for user ${userAddress} on Twitter:`, error);
    }

    return whitelistRequest;
  } 
};

export type ParserFunction = (action: MidgardAction, dbManager: DatabaseManager) => Promise<ParserResult>;
export type ParserMap = Record<string, ParserFunction>;

export function getParser(parserName: string): ParserFunction {
  const parser = (parsers as ParserMap)[parserName];
  if (!parser) {
    throw new Error(`Parser ${parserName} not found`);
  }
  return parser;
} 