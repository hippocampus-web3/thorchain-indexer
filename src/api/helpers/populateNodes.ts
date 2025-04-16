import { NodeListing } from "@/entities/NodeListing";
import logger from "../../utils/logger";
import { NodeDTO } from "../types/NodeDTO";

export function populateNodesWithNetworkInfo (nodes: NodeListing[], officialNodes: any[], currentBlockHeight: number) {
  const nodesWithNetworkInfo = nodes.map(node => {
    const officialNode = officialNodes.find(on => on.node_address === node.nodeAddress && on.node_operator_address === node.operatorAddress);
    if (!officialNode) {
      logger.error(`Node not found in official nodes: ${node.nodeAddress} ${node.operatorAddress}`);
      throw new Error(`Node not found in official nodes: ${node.nodeAddress} ${node.operatorAddress}`);
    }

    const populateNode: NodeDTO = {
      ...node,
      status: officialNode?.status,
      slashPoints: officialNode?.slash_points,
      activeTime: computeActiveTimeInSeconds(officialNode?.status_since, currentBlockHeight),
      bondProvidersCount: officialNode?.bond_providers.providers.length,
      officialInfo: {
        currentFee: Number(officialNode?.bond_providers.node_operator_fee)
      }
    }

    populateNode.isHidden = shouldBeHidden(populateNode)

    return populateNode
  });
  return nodesWithNetworkInfo
}

function shouldBeHidden(populateNode: Omit<NodeDTO, 'isHidden'>): { hide: boolean, reason: string | null } {
  if (populateNode.officialInfo.currentFee > populateNode.feePercentage) {
    return { hide: true, reason: 'The actual fee charged by this node is higher than what’s displayed on RUNEBond. Please double-check the on-chain fee before proceeding, as the advertised value may be outdated or incorrect.' }
  }
  return { hide: false, reason: null }
}

function computeActiveTimeInSeconds (activeTime: number, currentBlockHeight: number) {
    return (currentBlockHeight - activeTime) * 6
}