import { MidgardAction } from '../types';
import logger from '../utils/logger';
import { DatabaseManager } from '../db';
import { genericCache } from '../utils/genericCache';
import { announceNewNode, announceNewWhitelistRequest } from '../third-party-services/twitter';
import { NodeListing } from '../entities/NodeListing';
import { WhitelistRequest } from '../entities/WhitelistRequest';
import { ChatMessage } from '../entities/ChatMessage';
import xss from 'xss';
import { checkTransactionAmount } from '../utils/checkTransactionAmount';

const CHAT_COST_PER_MESSAGE_USERS = 100000000

export interface ParserResult {
  [key: string]: any;
}

const sanitizeString = (str: string): string => {
  if (!str) return '';
  
  let sanitized = str.trim();
  
  sanitized = sanitized
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .replace(/\s+/g, ' ');
  
  sanitized = xss(sanitized, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script'],
    allowCommentTag: false,
    css: false
  });
  
  return sanitized;
};

const sanitizeNumber = (str: string): number => {
  if (!str) return 0;
  
  const cleaned = str.replace(/[^\d.-]/g, '');
  
  const num = Number(cleaned);
  
  if (isNaN(num)) {
    throw new Error(`Invalid number: ${str}`);
  }
  
  return num;
};

export const parsers = {
  nodeListing: async (action: MidgardAction, dbManager: DatabaseManager): Promise<ParserResult> => {
    const memo = action.metadata.send.memo;

    const parts = memo.split(':');
    if (parts.length !== 7) {
      throw new Error(`Invalid memo format for node listing: ${memo}`);
    }

    const nodeAddress = sanitizeString(parts[2]);
    const operatorAddress = sanitizeString(parts[3]);

    if (operatorAddress !== action.in[0]?.address) {
      logger.warn(`Node list request rejected: Impersonated node operator ${operatorAddress}`);
      throw new Error(`Impersonated node operator ${nodeAddress}`);
    }

    const minRune = sanitizeNumber(parts[4]);
    const maxRune = sanitizeNumber(parts[5]);
    const feePercentage = sanitizeNumber(parts[6]);

    if (maxRune < minRune) {
      throw new Error(`maxRune (${maxRune}) must be greater than or equal to minRune (${minRune})`);
    }

    if (feePercentage < 0 || feePercentage > 10000) {
      throw new Error(`feePercentage (${feePercentage}) must be between 0 and 100`);
    }

    const nodeListingRepo = dbManager.getRepository('node_listings');
    
    const existingNode = await nodeListingRepo.findOne({ 
        where: { nodeAddress } 
    }) as NodeListing | null;

    if (existingNode) {
        logger.info(`Updating existing node listing for address ${nodeAddress}`);
        Object.assign(existingNode, {
            operatorAddress,
            minRune,
            maxRune,
            feePercentage,
            txId: sanitizeString(action.in[0].txID),
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
    nodeListing.minRune = minRune;
    nodeListing.maxRune = maxRune;
    nodeListing.feePercentage = feePercentage;
    nodeListing.txId = sanitizeString(action.in[0]?.txID);
    nodeListing.height = action.height;
    nodeListing.timestamp = new Date(Math.floor(Number(action.date) / 1000000));

    try {
      await announceNewNode(nodeListing);
      logger.info(`Successfully announced new node ${nodeAddress} on Twitter`);
    } catch (error) {
      logger.error(`Failed to announce new node ${nodeAddress} on Twitter:`, error);
    }

    return nodeListing;
  },

  nodeListingV2: async (action: MidgardAction, dbManager: DatabaseManager): Promise<ParserResult> => {
    const memo = action.metadata.send.memo;
    const parts = memo.split(':');
    if (parts.length !== 7) {
      throw new Error(`Invalid memo format for node listing V2: ${memo}`);
    }

    const nodeAddress = sanitizeString(parts[3]);

    // Get official node info first to validate operator
    const oficialNodes = await genericCache.getNodes();
    const officialNodeInfo = oficialNodes.find(on => on.node_address === nodeAddress);

    if (!officialNodeInfo) {
      logger.warn(`Node list request: Node ${nodeAddress} not found in official nodes`);
      throw new Error(`Node ${nodeAddress} not found in official nodes`);
    }

    // Verify that the sender is the actual node operator
    if (action.in[0]?.address !== officialNodeInfo.node_operator_address) {
      logger.warn(`Node list request rejected: Sender ${action.in[0]?.address} is not the node operator ${officialNodeInfo.node_operator_address}`);
      throw new Error(`Only the node operator can list a node`);
    }

    const minRune = sanitizeNumber(parts[4]);
    const targetTotalBond = sanitizeNumber(parts[5]);
    const feePercentage = sanitizeNumber(parts[6]);

    if (targetTotalBond < minRune) {
      throw new Error(`targetTotalBond (${targetTotalBond}) must be greater than or equal to minRune (${minRune})`);
    }

    if (feePercentage < 0 || feePercentage > 10000) {
      throw new Error(`feePercentage (${feePercentage}) must be between 0 and 100`);
    }

    const nodeListingRepo = dbManager.getRepository('node_listings');
    
    const existingNode = await nodeListingRepo.findOne({ 
        where: { nodeAddress } 
    }) as NodeListing | null;

    if (existingNode) {
        logger.info(`Updating existing node listing for address ${nodeAddress}`);
        Object.assign(existingNode, {
            operatorAddress: officialNodeInfo.node_operator_address,
            minRune,
            targetTotalBond,
            feePercentage,
            txId: sanitizeString(action.in[0].txID),
            height: action.height,
            timestamp: new Date(Math.floor(Number(action.date) / 1000000))
        });
        return existingNode;
    }

    const nodeListing = new NodeListing();
    nodeListing.nodeAddress = nodeAddress;
    nodeListing.operatorAddress = officialNodeInfo.node_operator_address;
    nodeListing.minRune = minRune;
    nodeListing.targetTotalBond = targetTotalBond;
    nodeListing.feePercentage = feePercentage;
    nodeListing.txId = sanitizeString(action.in[0]?.txID);
    nodeListing.height = action.height;
    nodeListing.timestamp = new Date(Math.floor(Number(action.date) / 1000000));

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
      throw new Error(`Invalid memo format for whitelist request: ${memo}`);
    }

    const userAddress = sanitizeString(parts[3]);
    const nodeAddress = sanitizeString(parts[2]);

    if (userAddress !== action.in[0]?.address) {
        logger.warn(`Whitelist request rejected: Impersonated address ${userAddress}`);
        throw new Error(`Impersonated address ${userAddress}`);
    }

    const intendedBondAmount = sanitizeNumber(parts[4]);

    const nodeListingRepo = dbManager.getRepository('node_listings');
    const node = await nodeListingRepo.findOne({ where: { nodeAddress } }) as NodeListing | null;
    
    if (!node) {
        logger.warn(`Whitelist request rejected: Node ${nodeAddress} does not exist`);
        throw new Error(`Node ${nodeAddress} does not exist`);
    }

    // Check for existing whitelist request
    const whitelistRepo = dbManager.getRepository('whitelist_requests');
    const existingRequest = await whitelistRepo.findOne({
      where: {
        nodeAddress,
        userAddress
      }
    }) as WhitelistRequest | null;

    if (existingRequest) {
      logger.info(`Updating existing whitelist request for user ${userAddress} to node ${nodeAddress}`);
      Object.assign(existingRequest, {
        intendedBondAmount,
        txId: sanitizeString(action.in[0].txID),
        height: action.height,
        timestamp: new Date(Math.floor(Number(action.date) / 1000000)),
        status: 'pending' // Reset status when updating
      });
      return existingRequest;
    }

    const whitelistRequest = new WhitelistRequest();
    whitelistRequest.nodeAddress = nodeAddress;
    whitelistRequest.userAddress = userAddress;
    whitelistRequest.intendedBondAmount = intendedBondAmount;
    whitelistRequest.txId = sanitizeString(action.in[0].txID);
    whitelistRequest.height = action.height;
    whitelistRequest.timestamp = new Date(Math.floor(Number(action.date) / 1000000));

    try {
      await announceNewWhitelistRequest(whitelistRequest);
      logger.info(`Successfully announced new whitelist request for user ${userAddress} on Twitter`);
    } catch (error) {
      logger.error(`Failed to announce new whitelist request for user ${userAddress} on Twitter:`, error);
    }

    return whitelistRequest;
  },

  chatMessage: async (action: MidgardAction, dbManager: DatabaseManager) => {
    const memo = action.metadata.send.memo;
    const parts = memo.split(':');
    if (parts.length !== 4) {
      throw new Error(`Invalid memo format for chat message: ${memo}`);
    }

    const nodeAddress = sanitizeString(parts[2]);
    const base64Message = parts[3];
    const userAddress = sanitizeString(action.in[0]?.address || '');

    if (!userAddress) {
      throw new Error('No sender address found in transaction');
    }

    // Verify node exists and get node info from Thornode
    const nodeListingRepo = dbManager.getRepository('node_listings');
    const node = await nodeListingRepo.findOne({ where: { nodeAddress } }) as NodeListing | null;
    
    if (!node) {
      logger.warn(`Chat message rejected: Node ${nodeAddress} does not exist`);
      throw new Error(`Node ${nodeAddress} does not exist`);
    }

    // Get node info from Thornode for the specific block
    const nodeInfo = await genericCache.getNodes(action.height);
    const nodeDetails = nodeInfo.find(n => n.node_address === nodeAddress);

    if (!nodeDetails) {
      logger.warn(`Chat message rejected: Could not fetch node details from Thornode for ${nodeAddress}`);
      throw new Error(`Could not fetch node details from Thornode`);
    }

    let role: 'BP' | 'NO' | 'USER' = 'USER';

    if (userAddress === nodeDetails.node_operator_address) {
      role = 'NO';
    } else if (nodeDetails?.bond_providers?.providers) {
      const isBondProvider = nodeDetails.bond_providers.providers.some(bp => 
        bp.bond_address === userAddress && 
        Number(bp.bond) > 0
      );
      if (isBondProvider) {
        role = 'BP';
      }
    }

    if (role === 'USER') {
      logger.warn(`Chat message rejected: User ${userAddress} is not a bond provider or node operator at block height ${action.height}`);
      checkTransactionAmount(action, CHAT_COST_PER_MESSAGE_USERS)
    }

    // Decode base64 message
    let message: string;
    try {
      message = Buffer.from(base64Message, 'base64').toString('utf-8');
    } catch (error) {
      logger.warn(`Failed to decode base64 message: ${base64Message}`);
      throw new Error('Invalid base64 message format');
    }

    message = sanitizeString(message);

    const chatMessage = new ChatMessage();
    chatMessage.role = role;
    chatMessage.nodeAddress = nodeAddress;
    chatMessage.userAddress = userAddress;
    chatMessage.message = message;
    chatMessage.txId = sanitizeString(action.in[0].txID);
    chatMessage.height = action.height;
    chatMessage.timestamp = new Date(Math.floor(Number(action.date) / 1000000));

    return chatMessage;
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