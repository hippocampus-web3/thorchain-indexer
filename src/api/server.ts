import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import logger from '../utils/logger';
import { AppDataSource } from '../data-source';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

app.use('/api/nodes', require('./routes/nodeRoutes').default);
app.use('/api/whitelist', require('./routes/whitelistRoutes').default);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const startServer = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('Conexión a la base de datos establecida');
    }
    
    app.listen(port, () => {
      logger.info(`API escuchando en el puerto ${port}`);
    });
  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer(); 