import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { WhitelistRequest } from "./WhitelistRequest";
import { ChatMessage } from "./ChatMessage";

@Entity("node_listings")
export class NodeListing {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "nodeAddress", unique: true })
    nodeAddress!: string;

    @Column({ name: "operatorAddress" })
    operatorAddress!: string;

    @Column({ name: "minRune" })
    minRune!: number;

    @Column({ name: "maxRune", nullable: true })
    maxRune?: number;

    @Column({ name: "feePercentage" })
    feePercentage!: number;

    @Column({ name: "txId" })
    txId!: string;

    @Column()
    height!: number;

    @Column()
    timestamp!: Date;

    @Column({ name: "targetTotalBond", type: "bigint", nullable: true })
    targetTotalBond?: number;

    @Column({ name: "isDelisted", default: false })
    isDelisted!: boolean;

    @OneToMany(() => WhitelistRequest, whitelistRequest => whitelistRequest.node)
    whitelistRequests!: WhitelistRequest[];

    @OneToMany(() => ChatMessage, chatMessage => chatMessage.node)
    chatMessages!: ChatMessage[];
} 