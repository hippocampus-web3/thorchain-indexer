import { Router } from 'express';
import { NodeController } from '../controllers/nodeController';

const router = Router();
const nodeController = new NodeController();

router.get('/', nodeController.getNodes);
router.get('/:address', nodeController.getNodeByAddress);

export default router; 