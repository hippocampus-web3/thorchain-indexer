import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { NodeListing } from "./NodeListing";

export type WhitelistRequestStatus = "pending" | "approved" | "rejected" | "bonded";

@Entity("whitelist_requests")
@Unique("UQ_WHITELIST_REQUEST", ["nodeAddress", "userAddress"])
export class WhitelistRequest {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "nodeAddress" })
    nodeAddress!: string;

    @Column({ name: "userAddress" })
    userAddress!: string;

    @Column({ name: "intendedBondAmount" })
    intendedBondAmount!: number;

    @Column({ name: "realBond", type: "bigint", default: 0 })
    realBond!: number;

    @Column({ name: "txId" })
    txId!: string;

    @Column()
    height!: number;

    @Column()
    timestamp!: Date;

    @Column({ 
        type: "enum", 
        enum: ["pending", "approved", "rejected", "bonded"],
        default: "pending"
    })
    status!: WhitelistRequestStatus;

    @ManyToOne(() => NodeListing, nodeListing => nodeListing.whitelistRequests)
    @JoinColumn({ name: "nodeAddress", referencedColumnName: "nodeAddress" })
    node!: NodeListing;
} 