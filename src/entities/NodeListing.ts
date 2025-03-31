import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("node_listings")
export class NodeListing {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "nodeAddress" })
    nodeAddress!: string;

    @Column({ name: "operatorAddress" })
    operatorAddress!: string;

    @Column({ name: "minRune" })
    minRune!: number;

    @Column({ name: "maxRune" })
    maxRune!: number;

    @Column({ name: "feePercentage" })
    feePercentage!: number;

    @Column({ name: "txId" })
    txId!: string;

    @Column()
    height!: number;

    @Column()
    timestamp!: Date;
} 