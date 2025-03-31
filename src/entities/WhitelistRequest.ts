import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { NodeListing } from "./NodeListing";

@Entity("whitelist_requests")
export class WhitelistRequest {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "nodeAddress" })
    nodeAddress!: string;

    @Column({ name: "userAddress" })
    userAddress!: string;

    @Column({ name: "intendedBondAmount" })
    intendedBondAmount!: number;

    @Column({ name: "txId" })
    txId!: string;

    @Column()
    height!: number;

    @Column()
    timestamp!: Date;

    @ManyToOne(() => NodeListing, nodeListing => nodeListing.whitelistRequests)
    @JoinColumn({ name: "nodeAddress", referencedColumnName: "nodeAddress" })
    node!: NodeListing;
} 