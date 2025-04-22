import { Router } from 'express';
import { NodeController } from '../controllers/nodeController';

const router = Router();
const nodeController = new NodeController();

router.get('/', nodeController.getNodes);

export default router; 