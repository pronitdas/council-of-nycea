import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';

import { logger } from '@uaip/utils';
import { errorHandler, rateLimiter, metricsMiddleware } from '@uaip/middleware';
import { DatabaseService, EventBusService } from '@uaip/shared-services';
import { agentRoutes } from './routes/agentRoutes.js';
import { healthRoutes } from './routes/healthRoutes.js';

class AgentIntelligenceService {
  private app: express.Application;
  private databaseService: DatabaseService;
  private eventBusService: EventBusService;

  constructor() {
    this.app = express();
    this.databaseService = new DatabaseService();
    this.eventBusService = new EventBusService({
      url: process.env.RABBITMQ_URL || 'amqp://localhost',
      serviceName: 'agent-intelligence'
    }, logger as any);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));

    // Performance middleware
    this.app.use(compression());
    // this.app.use(rateLimiter);

    // Logging middleware
    this.app.use(morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) }
    }));

    // Request parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Metrics middleware
    // this.app.use(metricsMiddleware);
  }

  private setupRoutes(): void {
    // Health check routes
    this.app.use('/health', healthRoutes);
    
    // API routes
    this.app.use('/api/v1/agents', agentRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found'
        },
        meta: {
          timestamp: new Date(),
          version: process.env.VERSION || '1.0.0'
        }
      });
    });
  }

  private setupErrorHandling(): void {
    // this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Test database connection
      await this.databaseService.query('SELECT 1', []);
      logger.info('Database connection verified');

      // Event bus will connect automatically when needed
      logger.info('Event bus ready');

      // Start HTTP server
      const port = parseInt(process.env.PORT || '3001', 10);
      this.app.listen(port, () => {
        logger.info(`Agent Intelligence Service started on port ${port}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`Version: ${process.env.VERSION || '1.0.0'}`);
      });

    } catch (error) {
      logger.error('Failed to start Agent Intelligence Service:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      // Close connections if methods exist
      if (this.eventBusService && typeof this.eventBusService.close === 'function') {
        await this.eventBusService.close();
      }
      if (this.databaseService && typeof this.databaseService.close === 'function') {
        await this.databaseService.close();
      }
      logger.info('Agent Intelligence Service stopped gracefully');
    } catch (error) {
      logger.error('Error during service shutdown:', error);
    }
  }
}

// Initialize and start the service
const service = new AgentIntelligenceService();

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await service.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await service.stop();
  process.exit(0);
});

// Start the service
service.start().catch((error) => {
  logger.error('Failed to start service:', error);
  process.exit(1);
}); 