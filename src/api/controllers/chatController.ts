import { Request, Response } from 'express';
import { AppDataSourceApi } from '../../data-source-api';
import { ChatMessage } from '../../entities/ChatMessage';
import { NodeListing } from '../../entities/NodeListing';

export class ChatController {
    private chatRepository = AppDataSourceApi.getRepository(ChatMessage);
    private nodeRepository = AppDataSourceApi.getRepository(NodeListing);

    async getNodeChatHistory(req: Request, res: Response) {
        try {
            const { nodeAddress } = req.params;

            const node = await this.nodeRepository.findOne({
                where: { nodeAddress }
            });

            if (!node) {
                return res.status(404).json({
                    success: false,
                    message: 'Node not found'
                });
            }

            const messages = await this.chatRepository.find({
                where: { nodeAddress },
                order: {
                    timestamp: 'ASC'
                }
            });

            return res.status(200).json({
                success: true,
                data: messages
            });
        } catch (error) {
            console.error('Error fetching chat history:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
} 