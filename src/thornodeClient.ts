import axios from "axios";

export async function getAllNodes(): Promise<any[]> {
    const THORNODE_API_URL = 'https://thornode.ninerealms.com/thorchain/nodes';
  
    try {
      const response = await axios.get(THORNODE_API_URL);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all nodes:', error);
      throw new Error('Failed to retrieve all nodes');
    }
  }