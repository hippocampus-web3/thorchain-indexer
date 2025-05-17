import { Router } from 'express';
import nodeRoutes from './nodeRoutes';
import whitelistRoutes from './whitelistRoutes';
import chatRoutes from './chatRoutes';
import subscriptionRoutes from './subscriptionRoutes';

const router = Router();

router.use('/nodes', nodeRoutes);
router.use('/whitelist', whitelistRoutes);
router.use('/chat', chatRoutes);
router.use('/subscriptions', subscriptionRoutes);

export default router; 