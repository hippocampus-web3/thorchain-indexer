import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { NodeListing } from "./NodeListing";

export type ChatMessageRole = 'BP' | 'NO' | 'USER';

@Entity("chat_messages")
export class ChatMessage {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "nodeAddress" })
    nodeAddress!: string;

    @Column({ name: "userAddress" })
    userAddress!: string;

    @Column({ name: "message", type: "text" })
    message!: string;

    @Column({ name: "role", type: "enum", enum: ['BP', 'NO', 'USER'] })
    role!: ChatMessageRole;

    @Column({ name: "txId" })
    txId!: string;

    @Column()
    height!: number;

    @Column()
    timestamp!: Date;

    @ManyToOne(() => NodeListing, nodeListing => nodeListing.chatMessages)
    @JoinColumn({ name: "nodeAddress", referencedColumnName: "nodeAddress" })
    node!: NodeListing;
} 