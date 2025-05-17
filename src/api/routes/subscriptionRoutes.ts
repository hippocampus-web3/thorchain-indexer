import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscriptionController';
import rateLimit from 'express-rate-limit';

const router = Router();
const subscriptionController = new SubscriptionController();

const subscriptionLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: {
        error: 'Too many subscription requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/', subscriptionLimiter, subscriptionController.createSubscription.bind(subscriptionController));

export default router; 