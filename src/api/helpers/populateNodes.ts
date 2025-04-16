import { NodeListing } from "@/entities/NodeListing";
import logger from "../../utils/logger";
import { NodeDTO } from "../types/NodeDTO";
import { Node, NodesResponse } from "@xchainjs/xchain-thornode";
import { baseAmount, baseToAsset } from "@xchainjs/xchain-util";

export function populateNodesWithNetworkInfo (nodes: NodeListing[], officialNodes: NodesResponse, currentBlockHeight: number, minimumBondInRune: number) {
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
        currentFee: Number(officialNode?.bond_providers.node_operator_fee),
        minimumBondInRune
      }
    }

    populateNode.isHidden = shouldBeHidden(populateNode, officialNode, minimumBondInRune)

    return populateNode
  });
  return nodesWithNetworkInfo
}

function shouldBeHidden(populateNode: Omit<NodeDTO, 'isHidden'>, officialNode: Node, minimumBondInRune: number): { hide: boolean, reasons: string[] | null } {
  const reasons = []
  if (Number(officialNode.total_bond) < minimumBondInRune) {
    reasons.push(`The node is not bonded enough to be visible on the platform. Minimun bond required: ${baseToAsset(baseAmount(minimumBondInRune, 8)).amount().toString()} RUNE`)
  }
  if (populateNode.officialInfo.currentFee > populateNode.feePercentage) {
    reasons.push('The actual fee charged by this node is higher than what’s displayed on RUNEBond. Please double-check the on-chain fee before proceeding, as the advertised value may be outdated or incorrect.')
  }
  return { hide: reasons.length > 0, reasons: reasons }
}

function computeActiveTimeInSeconds (activeTime: number, currentBlockHeight: number) {
    return (currentBlockHeight - activeTime) * 6
}