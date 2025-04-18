import { Router } from 'express';
import { ChatController } from '../controllers/chatController';

const router = Router();
const chatController = new ChatController();

router.get('/:nodeAddress', chatController.getNodeChatHistory.bind(chatController));

export default router; 