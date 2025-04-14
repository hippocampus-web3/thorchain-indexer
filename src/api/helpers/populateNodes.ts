import { NodeListing } from "@/entities/NodeListing";
import { WhitelistRequest } from "@/entities/WhitelistRequest";
import logger from "../../utils/logger";

export function populateNodesWithNetworkInfo (nodes: NodeListing[], officialNodes: any[], currentBlockHeight: number) {
    const nodesWithNetworkInfo = nodes.map(node => {
      const officialNode = officialNodes.find(on => on.node_address === node.nodeAddress && on.node_operator_address === node.operatorAddress);
      if (!officialNode) {
        logger.error(`Node not found in official nodes: ${node.nodeAddress} ${node.operatorAddress}`);
        throw new Error(`Node not found in official nodes: ${node.nodeAddress} ${node.operatorAddress}`);
      }
      return {
        ...node,
        status: officialNode?.status,
        slashPoints: officialNode?.slash_points,
        activeTime: computeActiveTimeInSeconds(officialNode?.status_since, currentBlockHeight),
        bondProvidersCount: officialNode?.bond_providers.providers.length
      };
    });
    return nodesWithNetworkInfo
  }

function computeActiveTimeInSeconds (activeTime: number, currentBlockHeight: number) {
    return (currentBlockHeight - activeTime) * 6
}