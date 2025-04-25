import { NodeListing } from "@/entities/NodeListing";
import logger from "../../utils/logger";
import { NodeDTO } from "../types/NodeDTO";
import { Node, NodesResponse } from "@xchainjs/xchain-thornode";
import { baseAmount, baseToAsset } from "@xchainjs/xchain-util";

const OPTIMAL_BOND = 100000000000000 // 1M . TODO: Cacl it dinamically

export function populateNodesWithNetworkInfo (nodes: NodeListing[], officialNodes: NodesResponse, currentBlockHeight: number, minimumBondInRune: number) {
  const nodesWithNetworkInfo = nodes.map(node => {
    const officialNode = officialNodes.find(on => on.node_address === node.nodeAddress && on.node_operator_address === node.operatorAddress);
    if (!officialNode) {
      logger.error(`Node not found in official nodes: ${node.nodeAddress} ${node.operatorAddress}`);
      throw new Error(`Node not found in official nodes: ${node.nodeAddress} ${node.operatorAddress}`);
    }

    const targetTotalBond = node.targetTotalBond || OPTIMAL_BOND
    const currentTotalBond = Number(officialNode?.total_bond)

    const populateNode: NodeDTO = {
      ...node,
      status: officialNode?.status,
      slashPoints: officialNode?.slash_points,
      activeTime: computeActiveTimeInSeconds(officialNode?.status_since, currentBlockHeight),
      bondProvidersCount: officialNode?.bond_providers.providers.length,
      maxRune: targetTotalBond - currentTotalBond,
      officialInfo: {
        currentFee: Number(officialNode?.bond_providers.node_operator_fee),
        minimumBondInRune,
        totalBond: Number(officialNode?.total_bond)
      }
    }

    populateNode.isHidden = shouldBeHidden(populateNode, officialNode, minimumBondInRune)
    populateNode.isYieldGuarded = shouldBeYieldGuarded(officialNode, officialNodes)

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

function shouldBeYieldGuarded(officialNode: Node, allOficialNodes: Node[]): { hide: boolean, reasons: string[] | null } {
  const reasons = [];
  
  // Only consider active nodes
  const activeNodes = allOficialNodes.filter(node => node.status === 'Active');
  
  // Check if node has requested to leave
  if (officialNode.requested_to_leave) {
    reasons.push("This node has requested to leave the network and will go to Standby state in less than 3 days, temporarily stopping yield generation until it returns to Active state");
  }
  
  // Check if node has highest slash points
  const maxSlashPoints = Math.max(...activeNodes.map(node => Number(node.slash_points)));
  if (Number(officialNode.slash_points) === maxSlashPoints) {
    reasons.push("This node has the highest slash points in the network and will go to Standby state in less than 3 days, temporarily stopping yield generation until it returns to Active state");
  }
  
  // Check if node has lowest total bond
  const minTotalBond = Math.min(...activeNodes.map(node => Number(node.total_bond)));
  if (Number(officialNode.total_bond) === minTotalBond) {
    reasons.push("This node has the lowest total bond in the network and will go to Standby state in less than 3 days, temporarily stopping yield generation until it returns to Active state");
  }
  
  // Check if node has oldest status_since
  const oldestStatusSince = Math.min(...activeNodes.map(node => Number(node.status_since)));
  if (Number(officialNode.status_since) === oldestStatusSince) {
    reasons.push("This node is the oldest active node in the network and will go to Standby state in less than 3 days, temporarily stopping yield generation until it returns to Active state");
  }
  
  // Original condition for optimal bond
  if (Number(officialNode.total_bond) > OPTIMAL_BOND) {
    reasons.push(`This node's total bond is equal to or higher than the network's optimal bond, making it inefficient for earning yield. Optimal bond: ${baseToAsset(baseAmount(OPTIMAL_BOND, 8)).amount().toString()} RUNE`);
  }
  
  return { hide: reasons.length > 0, reasons: reasons.length > 0 ? reasons : null };
}

function computeActiveTimeInSeconds (activeTime: number, currentBlockHeight: number) {
    return (currentBlockHeight - activeTime) * 6
}