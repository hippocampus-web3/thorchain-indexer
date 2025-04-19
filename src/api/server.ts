import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import logger from '../utils/logger';
import { AppDataSourceApi } from '../data-source-api';
import dotenv from 'dotenv';
import { WhitelistStatusUpdater } from '../services/whitelistStatusUpdater';
import chatRoutes from './routes/chatRoutes';
import statsRoutes from './routes/statsRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

app.use('/api/nodes', require('./routes/nodeRoutes').default);
app.use('/api/whitelist', require('./routes/whitelistRoutes').default);
app.use('/api/chat', chatRoutes);
app.use('/api/stats', statsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error not handled:', err);
  res.status(500).json({ error: 'Internatl server error' });
});

const startServer = async () => {
  try {
    if (!AppDataSourceApi.isInitialized) {
      await AppDataSourceApi.initialize();
      logger.info('Conexión a la base de datos establecida');
    }
    
    // Start WhitelistStatusUpdater
    const whitelistStatusUpdater = WhitelistStatusUpdater.getInstance();
    whitelistStatusUpdater.start();
    logger.info('WhitelistStatusUpdater started');
    
    app.listen(port, () => {
      logger.info(`API listin on ${port}`);
    });
  } catch (error) {
    logger.error('Error on servir initalization:', error);
    process.exit(1);
  }
};

startServer(); 