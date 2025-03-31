import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

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
} 