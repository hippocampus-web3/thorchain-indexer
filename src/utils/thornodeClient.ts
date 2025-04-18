import { Configuration, MimirApi, NetworkApi, NodeBondProvider, NodesApi, NodesResponse } from "@xchainjs/xchain-thornode";
import logger from "./logger";
import axios from "axios";

const THORNODE_API_URL = 'https://thornode-v2.ninerealms.com';

const apiconfig = new Configuration({ basePath: THORNODE_API_URL })

const nodesApi = new NodesApi(apiconfig, undefined, axios)
const networkApi = new NetworkApi(apiconfig, undefined, axios)
const mimirApi = new MimirApi(apiconfig, undefined, axios)

export async function getAllNodes(height?: number): Promise<NodesResponse> {
  try {
    const response = await nodesApi.nodes(height ? height : undefined)
    return response.data
  } catch (error: any) {
    logger.error('Failed to fetch all nodes:', error?.response?.status, error?.response?.data || error?.message);
    throw new Error('Failed to retrieve all nodes');
  }
}

export async function getCurrentBlockHeight(): Promise<number> {
  try {
    const response = await networkApi.lastblock()
    const height = response.data?.[0]?.thorchain;
    if (isNaN(height)) {
      throw new Error('Invalid block height');
    }
    return height;
  } catch (error) {
    logger.error('Failed to fetch current block height:', error);
    throw new Error('Failed to retrieve current block height');
  }
}

export async function getMinimumBondInRune(): Promise<number> {
  try {
    const response = await mimirApi.mimirKey('MINIMUMBONDINRUNE')
    return Number(response.data)
  } catch (error) {
    logger.error('Failed to fetch node data:', error);
    throw new Error('Failed to retrieve bond info');
  }
}