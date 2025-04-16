import { Configuration, MimirApi, NetworkApi, NodesApi, NodesResponse } from "@xchainjs/xchain-thornode";
import logger from "./logger";

const THORNODE_API_URL = 'https://thornode-v2.ninerealms.com/';

const apiconfig = new Configuration({ basePath: THORNODE_API_URL })

const nodesApi = new NodesApi(apiconfig)
const networkApi = new NetworkApi(apiconfig)
const mimirApi = new MimirApi(apiconfig)

export async function getAllNodes(): Promise<NodesResponse> {  // TODO: User types
  try {
    const response = await nodesApi.nodes()
    return response.data
  } catch (error) {
    console.log(error)
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

export async function getBondInfoForUser(
  nodeAddress: string,
  userAddress: string
): Promise<{ isBondProvider: boolean; status: string; bond: number }> {
  if (!nodeAddress.startsWith('thor1') || !userAddress.startsWith('thor1')) {
    throw new Error('Invalid THORChain address');
  }

  try {
    const response = await nodesApi.node(nodeAddress)
    const bondProviders = response.data?.bond_providers?.providers ?? [];

    const provider = bondProviders.find(
      (bp) => bp.bond_address === userAddress
    );

    if (provider) {
      return {
        isBondProvider: true,
        status: response.data?.status,
        bond: Number(provider.bond)
      };
    }

    return {
      isBondProvider: false,
      status: response.data?.status,
      bond: 0
    };
  } catch (error) {
    logger.error('Failed to fetch node data:', error);
    throw new Error('Failed to retrieve bond info');
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