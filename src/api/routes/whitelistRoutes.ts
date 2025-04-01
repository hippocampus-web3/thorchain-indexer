import { Router } from 'express';
import { WhitelistController } from '../controllers/whitelistController';

const router = Router();
const whitelistController = new WhitelistController();

router.get('/', whitelistController.getWhitelistRequests);
router.get('/:id', whitelistController.getWhitelistRequestById);

export default router; 