import { WhitelistRequest } from "@/entities/WhitelistRequest";

export type NodeDTO = {
    id: number;
    nodeAddress: string;
    operatorAddress: string;
    minRune: number;
    maxRune: number;
    feePercentage: number;
    txId: string;
    height: number;
    timestamp: Date;
    status: any;
    slashPoints: any;
    activeTime: number;
    bondProvidersCount: any;
    officialInfo: {
        currentFee: number;
        minimumBondInRune: number;
        totalBond: number;
    };
    isHidden?: {
        hide: boolean,
        reasons: string[] | null
    }
    whitelistRequests: WhitelistRequest[]
}