import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from '@uaip/config';

/**
 * TypeORM Configuration for UAIP Backend
 * Centralized database configuration for all services
 */

export const createTypeOrmConfig = (entities?: any[], disableCache = false): DataSourceOptions => {
  const dbConfig = config.database.postgres;
  
  // Prepare cache configuration conditionally with better error handling
  let cacheConfig: any = false;
  if (!disableCache && process.env.NODE_ENV !== 'migration') {
    try {
      // Test Redis connection availability before configuring cache
      const redisConfig = config.redis;
      if (redisConfig.host && redisConfig.port) {
        cacheConfig = {
          type: 'redis',
          options: {
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password,
            db: redisConfig.db + 1, // Use different DB for cache
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true, // Don't fail if Redis is not available immediately
            enableOfflineQueue: false, // Don't queue commands when Redis is offline
          },
          duration: 30000, // 30 seconds
          ignoreErrors: true, // Don't fail TypeORM initialization if Redis fails
        };
        console.log('✅ Redis cache configured for TypeORM');
      } else {
        console.warn('⚠️  Redis configuration incomplete, proceeding without cache');
        cacheConfig = false;
      }
    } catch (error) {
      console.warn('⚠️  Redis cache configuration failed, proceeding without cache:', error.message);
      cacheConfig = false;
    }
  }

  const baseConfig: DataSourceOptions = {
    type: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
    
    // Entity configuration - use built entities from dist folder
    entities: entities || ['dist/entities/*.js'],
    
    // Migration configuration
    migrations: ['dist/migrations/*.js'],
    migrationsTableName: 'typeorm_migrations',
    migrationsRun: false, // Set to true for auto-migration in development
    
    // Synchronization (NEVER use in production)
    synchronize: false,
    
    // Logging configuration
    logging: config.logging.enableDetailedLogging ? ['query', 'error', 'warn'] : ['error'],
    logger: 'advanced-console',
    
    // Connection pool configuration
    extra: {
      max: dbConfig.maxConnections,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: config.timeouts.database,
      statement_timeout: config.timeouts.database,
      query_timeout: config.timeouts.database,
    },
    
    // Cache configuration (conditionally set)
    cache: cacheConfig,
    
    // Development features
    dropSchema: false,
    
        // Use default naming strategy for now
    // namingStrategy: 'snake_case',
  };

  return baseConfig;
};

// Create the main DataSource instance
export const AppDataSource = new DataSource(createTypeOrmConfig());

/**
 * Initialize TypeORM connection with retry logic
 */
export const initializeDatabase = async (maxRetries = 3): Promise<DataSource> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!AppDataSource.isInitialized) {
        console.log(`🔄 Attempting to initialize TypeORM DataSource (attempt ${attempt}/${maxRetries})`);
        await AppDataSource.initialize();
        console.log('✅ TypeORM DataSource initialized successfully');
      }
      return AppDataSource;
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Error initializing TypeORM DataSource (attempt ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed to initialize TypeORM after ${maxRetries} attempts. Last error: ${lastError.message}`);
};

/**
 * Close TypeORM connection
 */
export const closeDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('✅ TypeORM DataSource closed successfully');
    }
  } catch (error) {
    console.error('❌ Error closing TypeORM DataSource:', error);
    throw error;
  }
};

/**
 * Get TypeORM DataSource instance
 */
export const getDataSource = (): DataSource => {
  if (!AppDataSource.isInitialized) {
    throw new Error('DataSource is not initialized. Call initializeDatabase() first.');
  }
  return AppDataSource;
};

/**
 * Health check for TypeORM connection
 */
export const checkDatabaseHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  details: {
    connected: boolean;
    driver: string;
    database: string;
    responseTime?: number;
    cacheEnabled?: boolean;
  };
}> => {
  const startTime = Date.now();
  
  try {
    if (!AppDataSource.isInitialized) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          driver: 'postgres',
          database: config.database.postgres.database,
          cacheEnabled: false,
        },
      };
    }

    // Simple query to test connection
    await AppDataSource.query('SELECT 1');
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      details: {
        connected: true,
        driver: 'postgres',
        database: config.database.postgres.database,
        responseTime,
        cacheEnabled: !!AppDataSource.options.cache,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        connected: false,
        driver: 'postgres',
        database: config.database.postgres.database,
        responseTime: Date.now() - startTime,
        cacheEnabled: false,
      },
    };
  }
};

// Export configuration for external use
export { createTypeOrmConfig as typeormConfig };
export default AppDataSource; 