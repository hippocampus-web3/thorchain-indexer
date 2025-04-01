import axios from "axios";

const THORNODE_API_URL = 'https://thornode.ninerealms.com/thorchain';

export async function getAllNodes(): Promise<any[]> {  
  try {
    const response = await axios.get(`${THORNODE_API_URL}/nodes`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch all nodes:', error);
    throw new Error('Failed to retrieve all nodes');
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
    const response = await axios.get(`${THORNODE_API_URL}/node/${nodeAddress}`);
    const bondProviders = response.data?.bond_providers?.providers ?? [];

    const provider = bondProviders.find(
      (bp: { bond_address: string; bond: string }) => bp.bond_address === userAddress
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
    console.error('Failed to fetch node data:', error);
    throw new Error('Failed to retrieve bond info');
  }
}
