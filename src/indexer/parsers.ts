import { AppDataSource } from '../data-source';
import { NodeListing } from '../entities/NodeListing';
import { getAllNodes } from '../thornodeClient';
import { MidgardAction } from '../types';
import logger from '../utils/logger';

export interface ParserResult {
  [key: string]: any;
}

export const parsers = {
  nodeListing: async (action: MidgardAction): Promise<ParserResult> => {
    const memo = action.metadata.send.memo;

    const parts = memo.split(':');
    if (parts.length !== 7) {
      throw new Error(`Invalid memo format for node listing: ${memo}`);
    }

    const operatorAddress = parts[3]
    const nodeAddress = parts[2]

    if (operatorAddress !== action.in[0]?.address) {
      logger.warn(`Node list request rejected: Impersonated node operator ${operatorAddress}`);
      throw new Error(`Impersonated node operator ${nodeAddress}`);
    }

    const nodeListingRepo = AppDataSource.getRepository(NodeListing);
    
    const existingNode = await nodeListingRepo.findOne({ 
        where: { nodeAddress } 
    });

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

    if (operatorAddress !== action.in[0]?.address) {
      logger.warn(`Node list request rejected: Impersonated node operator ${operatorAddress}`);
      throw new Error(`Impersonated node operator ${nodeAddress}`);
    }

    const oficialNodes = await getAllNodes(); // TODO: Optimize this request
    const officialNodeInfo = oficialNodes.find(on => on.node_address === nodeAddress && on.node_operator_address === operatorAddress)

    if (!officialNodeInfo) {
      logger.warn(`Node list request: Node and node operator mismatch ${nodeAddress} ${operatorAddress}`);
      throw new Error(`Node list request: Node and node operator mismatch ${nodeAddress} ${operatorAddress}`);
    }

    return {
      nodeAddress,
      operatorAddress,
      minRune: Number(parts[4]),
      maxRune: Number(parts[5]),
      feePercentage: Number(parts[6]),
      txId: action.in[0]?.txID,
      height: action.height,
      timestamp: new Date(Math.floor(Number(action.date) / 1000000))
    };
  },
  whitelistRequest: async (action: MidgardAction) => {
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

    const nodeListingRepo = AppDataSource.getRepository(NodeListing);
    const node = await nodeListingRepo.findOne({ where: { nodeAddress } });
    
    if (!node) {
        logger.warn(`Whitelist request rejected: Node ${nodeAddress} does not exist`);
        throw new Error(`Node ${nodeAddress} does not exist`);
    }

    return {
        nodeAddress,
        userAddress,
        intendedBondAmount: parseInt(parts[4]),
        txId: action.in[0].txID,
        height: action.height,
        timestamp: new Date(Math.floor(Number(action.date) / 1000000))
    };
  } 
};

export type ParserFunction = (action: MidgardAction) => ParserResult;
export type ParserMap = Record<string, ParserFunction>;

export function getParser(parserName: string): ParserFunction {
  const parser = (parsers as ParserMap)[parserName];
  if (!parser) {
    throw new Error(`Parser ${parserName} not found`);
  }
  return parser;
} 