import { NodeListing } from "../../entities/NodeListing";

export type WhitelistRequestStatus = 'pending' | 'approved' | 'bonded' | 'rejected';

export interface WhitelistDTO {
    id: number;
    nodeAddress: string;
    userAddress: string;
    intendedBondAmount: number;
    txId: string;
    height: number;
    timestamp: Date;
    status: WhitelistRequestStatus;
    node: NodeListing;
    realBond: number; // The actual bond amount from the network
}
