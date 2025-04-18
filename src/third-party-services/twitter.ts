import axios from "axios";
import OAuth from "oauth-1.0a";
import crypto from "crypto";
import { NodeListing } from "../entities/NodeListing";
import { WhitelistRequest } from "../entities/WhitelistRequest";
import { baseAmount, baseToAsset } from "@xchainjs/xchain-util";

/**
 * Publishes a tweet using Twitter API v2 with OAuth 1.0a User Context
 * 
 * @param content The content of the tweet to publish
 * @returns The ID of the published tweet and its text
 */
export async function publishTweet(content: string): Promise<{ id: string, text: string }> {

  if (process.env.TWITTER_NOTIFICATIONS_DISABLED) {
    return { id: '-1', text: '' };
  }
  // Check if all required environment variables are set
  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET || 
      !process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_SECRET) {
    throw new Error('Twitter credentials not set. Required: TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET');
  }
  
  // Setup OAuth 1.0a
  const oauth = new OAuth({
    consumer: {
      key: process.env.TWITTER_API_KEY,
      secret: process.env.TWITTER_API_SECRET,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
      return crypto
        .createHmac('sha1', key)
        .update(base_string)
        .digest('base64');
    },
  });
  
  // Request data
  const url = 'https://api.twitter.com/2/tweets';
  const method = 'POST';
  
  // Generate authorization header
  const token = {
    key: process.env.TWITTER_ACCESS_TOKEN,
    secret: process.env.TWITTER_ACCESS_SECRET,
  };
  
  const authorization = oauth.authorize(
    { url, method },
    token
  );
  
  const headers = {
    ...oauth.toHeader(authorization),
    'Content-Type': 'application/json',
  };
  
  try {
    const response = await axios.post(
      url,
      { text: content },
      { headers }
    );
    
    return {
      id: response.data.data.id,
      text: response.data.data.text
    };
  } catch (error: any) {
    if (error?.response?.data) {
      console.error("Twitter API Error:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error publishing tweet:", error);
    }
    throw new Error('Failed to publish tweet');
  }
}

/**
 * Announces a new node listing on Twitter
 * 
 * @param node The node that was listed
 * @returns The ID of the published tweet and its text
 */
export async function announceNewNode(node: NodeListing): Promise<{ id: string, text: string }> {
  const nodeUrl = `https://runebond.com/nodes/${node.nodeAddress}`;
  const content = `🚀 New Node Listed on RUNEBond!\n\n` +
    `🔗 Node: ${node.nodeAddress}\n` +
    `👤 Operator: ${node.operatorAddress}\n` +
    `💰 Fee: ${node.feePercentage / 100}%\n` +
    `📊 Min Rune: ${baseToAsset(baseAmount(node.minRune)).amount().toString()}\n` +
    `📈 Max Rune: ${baseToAsset(baseAmount(node.maxRune)).amount().toString()}\n\n` +
    `🔍 View details: ${nodeUrl}\n\n`

  return publishTweet(content);
}

/**
 * Announces a new whitelist request on Twitter
 * 
 * @param request The whitelist request that was submitted
 * @returns The ID of the published tweet and its text
 */
export async function announceNewWhitelistRequest(request: WhitelistRequest): Promise<{ id: string, text: string }> {
  const userUrl = `https://runebond.com/user-requests?user=${request.userAddress}`;
  const content = `📝 New Whitelist Request on RUNEBond!\n\n` +
    `🔗 Node: ${request.nodeAddress}\n` +
    `👤 User: ${request.userAddress}\n\n` +
    `🔍 View details: ${userUrl}\n\n`

  return publishTweet(content);
}