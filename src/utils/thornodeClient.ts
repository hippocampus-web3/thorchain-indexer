import { Configuration, MimirApi, NetworkApi, NodesApi, NodesResponse } from "@xchainjs/xchain-thornode";
import logger from "./logger";
import axios from "axios";

const THORNODE_API_URL = 'https://thornode-v2.ninerealms.com';

// Rate limiting configuration
const MAX_REQUESTS_PER_SECOND = 5;
const REQUEST_WINDOW = 1000; // 1 second in milliseconds
let requestTimestamps: number[] = [];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function waitForRateLimit() {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(timestamp => now - timestamp < REQUEST_WINDOW);
  
  if (requestTimestamps.length >= MAX_REQUESTS_PER_SECOND) {
    const oldestRequest = requestTimestamps[0];
    const waitTime = REQUEST_WINDOW - (now - oldestRequest);
    if (waitTime > 0) {
      await sleep(waitTime);
    }
    requestTimestamps = requestTimestamps.slice(1);
  }
  
  requestTimestamps.push(now);
}

// Exponential backoff configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

async function makeRequest<T>(fn: () => Promise<T>): Promise<T> {
  let retries = 0;
  let delay = INITIAL_DELAY;

  while (retries < MAX_RETRIES) {
    try {
      // Wait for rate limiter
      await waitForRateLimit();
      
      return await fn();
    } catch (error: any) {
      if (error?.response?.status === 429) { // Rate limit error
        retries++;
        if (retries === MAX_RETRIES) {
          logger.error('Max retries reached for Thornode request');
          throw error;
        }
        
        logger.warn(`Rate limit hit, retrying in ${delay}ms (attempt ${retries}/${MAX_RETRIES})`);
        await sleep(delay);
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
  
  throw new Error('Max retries reached');
}

const apiconfig = new Configuration({ basePath: THORNODE_API_URL })

const nodesApi = new NodesApi(apiconfig, undefined, axios)
const networkApi = new NetworkApi(apiconfig, undefined, axios)
const mimirApi = new MimirApi(apiconfig, undefined, axios)

export async function getAllNodes(height?: number): Promise<NodesResponse> {
  return makeRequest(async () => {
    const response = await nodesApi.nodes(height ? height : undefined);
    return response.data;
  });
}

export async function getCurrentBlockHeight(): Promise<number> {
  return makeRequest(async () => {
    const response = await networkApi.lastblock();
    const height = response.data?.[0]?.thorchain;
    if (isNaN(height)) {
      throw new Error('Invalid block height');
    }
    return height;
  });
}

export async function getMinimumBondInRune(): Promise<number> {
  return makeRequest(async () => {
    const response = await mimirApi.mimirKey('MINIMUMBONDINRUNE');
    return Number(response.data);
  });
}