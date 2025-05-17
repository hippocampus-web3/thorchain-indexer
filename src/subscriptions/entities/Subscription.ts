import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('subscriptions')
export class Subscription {
    @PrimaryColumn('uuid')
    user_id: string;

    @Column('text')
    email: string;

    @PrimaryColumn('text')
    observable_address: string;

    @PrimaryColumn('text')
    channel: string;

    @Column('boolean', { default: true })
    enabled: boolean;

    @Column('timestamp')
    subscribed_until: Date;

    @Column('text', { nullable: true })
    subscription_code: string;
} 