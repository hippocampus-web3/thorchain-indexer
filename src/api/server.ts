import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import logger from '../utils/logger';
import { AppDataSourceApi } from '../data-source-api';
import { subscriptionDataSource } from '../data-source-subscription';
import dotenv from 'dotenv';
import { WhitelistStatusUpdater } from '../services/whitelistStatusUpdater';
import chatRoutes from './routes/chatRoutes';
import statsRoutes from './routes/statsRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';

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
app.use('/api/subscriptions', subscriptionRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const startServer = async () => {
  try {
    // Initialize main database connection
    if (!AppDataSourceApi.isInitialized) {
      await AppDataSourceApi.initialize();
      logger.info('Main database connection established');
    }

    // Initialize subscriptions database connection
    if (!subscriptionDataSource.isInitialized) {
      await subscriptionDataSource.initialize();
      logger.info('Subscriptions database connection established');
    }
    
    // Start WhitelistStatusUpdater
    const whitelistStatusUpdater = WhitelistStatusUpdater.getInstance();
    whitelistStatusUpdater.start();
    
    app.listen(port, () => {
      logger.info(`API listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Error during server initialization:', error);
    process.exit(1);
  }
};

startServer(); 