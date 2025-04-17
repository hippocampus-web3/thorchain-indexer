import { Configuration, MimirApi, NetworkApi, NodeBondProvider, NodesApi, NodesResponse } from "@xchainjs/xchain-thornode";
import logger from "./logger";

const THORNODE_API_URL = 'https://thornode-v2.ninerealms.com/';

const apiconfig = new Configuration({ basePath: THORNODE_API_URL })

const nodesApi = new NodesApi(apiconfig)
const networkApi = new NetworkApi(apiconfig)
const mimirApi = new MimirApi(apiconfig)

export async function getAllNodes(): Promise<NodesResponse> {
  try {
    const response = await nodesApi.nodes()
    return response.data
  } catch (error) {
    logger.error('Failed to fetch all nodes:', error);
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


export async function getNodeBondInfo(nodeAddress: string): Promise<NodeBondProvider[]> {
  if (!nodeAddress.startsWith('thor1')) {
    throw new Error('Invalid THORChain node address');
  }

  try {
    const response = await nodesApi.node(nodeAddress)
    return response.data?.bond_providers?.providers || []
  } catch (error) {
    logger.error('Failed to fetch node data:', error);
    throw new Error('Failed to retrieve node bond info');
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