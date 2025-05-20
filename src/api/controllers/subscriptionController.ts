import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { subscriptionDataSource } from '../../data-source-subscription';
import logger from '../../utils/logger';

export class SubscriptionController {
    async createSubscription(req: Request, res: Response) {
        try {
            const { email, observable_address } = req.body;

            if (!email || typeof email !== 'string' || !email.includes('@')) {
                return res.status(400).json({ 
                    error: 'Invalid or missing email' 
                });
            }

            if (email.length > 255) {
                return res.status(400).json({
                    error: 'Email is too long'
                });
            }

            if (!observable_address || typeof observable_address !== 'string') {
                return res.status(400).json({ 
                    error: 'Invalid or missing observable address' 
                });
            }

            if (!observable_address.startsWith('thor1')) {
                return res.status(400).json({
                    error: 'Invalid Thorchain address format'
                });
            }

            if (observable_address.length > 255) {
                return res.status(400).json({
                    error: 'Observable address is too long'
                });
            }

            const existingSubscription = await subscriptionDataSource
                .createQueryBuilder()
                .select('*')
                .from('subscriptions', 'subscriptions')
                .where('subscriptions.email = :email', { email })
                .andWhere('subscriptions.observable_address = :observable_address', { observable_address })
                .andWhere('subscriptions.subscribed_until > :now', { now: new Date() })
                .getRawOne();

            if (existingSubscription) {
                return res.status(200).json({
                    success: true,
                    data: {
                        user_id: existingSubscription.user_id,
                        subscription_code: existingSubscription.subscription_code,
                        memo: `TB:SUB:${existingSubscription.subscription_code}`,
                        ...existingSubscription
                    },
                    is_new_subscription: false,
                });
            }

            const user_id = randomUUID();
            const subscription_code = `SUB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            const memo = `TB:SUB:${subscription_code}`;

            const subscribed_until = new Date();
            subscribed_until.setDate(subscribed_until.getDate() + 15);

            const result = await subscriptionDataSource
                .createQueryBuilder()
                .insert()
                .into('subscriptions')
                .values({
                    user_id,
                    email,
                    observable_address,
                    channel: 'email',
                    enabled: false,
                    subscription_code,
                    subscribed_until
                })
                .returning('*')
                .execute();

            return res.status(201).json({
                success: true,
                data: {
                    user_id,
                    subscription_code,
                    memo,
                    ...result.raw[0]
                },
                is_new_subscription: true,
            });

        } catch (error) {
            logger.error('Error creating subscription:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
} 