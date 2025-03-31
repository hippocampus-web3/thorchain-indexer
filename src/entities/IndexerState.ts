import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("indexer_state")
export class IndexerState {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    address!: string;

    @Column({ name: "last_block" })
    lastBlock!: number;

    @Column({ name: "last_updated" })
    lastUpdated!: Date;
} 