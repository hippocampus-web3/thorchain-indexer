import { ChatMessage } from "@/entities/ChatMessage";
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
    isDelisted: boolean;
    maxTimeToLeave: number;
    officialInfo: {
        currentFee: number;
        minimumBondInRune: number;
        totalBond: number;
    };
    isHidden?: {
        hide: boolean,
        reasons: string[] | null
    }
    isYieldGuarded?: {
        hide: boolean,
        reasons: string[] | null
    }
    whitelistRequests: WhitelistRequest[],
    chatMessages: ChatMessage[]
}