/**
 * @fileoverview Environment configuration loader with validation
 * @lastmodified 2025-10-28
 *
 * Features: Type-safe config loading, validation, and defaults
 * Main APIs: loadConfig(), config singleton
 * Constraints: Validates required env vars on startup, throws ConfigError if invalid
 * Patterns: Use config.get() to access values, supports .env files via dotenv
 */

import { ConfigError } from '@deep-research/shared';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

/**
 * Application configuration interface
 */
export interface AppConfig {
  // Application
  nodeEnv: string;
  port: number;
  logLevel: string;

  // OpenAI
  openai: {
    apiKey: string;
    model: string;
    embeddingModel: string;
  };

  // Neo4j
  neo4j: {
    uri: string;
    user: string;
    password: string;
  };

  // OpenSearch
  opensearch: {
    node: string;
    username: string;
    password: string;
    indexPrefix: string;
  };

  // Redis
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };

  // Object Storage (S3/MinIO)
  s3: {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    region: string;
  };

  // Browserbase (optional)
  browserbase?: {
    apiKey: string;
    projectId: string;
  };

  // Fetch Pipeline
  fetch: {
    userAgent: string;
    rateLimitDefault: number;
    timeoutMs: number;
    maxRetries: number;
  };

  // Security
  security: {
    jwtSecret: string;
    sessionSecret: string;
    corsOrigin: string;
  };

  // Observability
  telemetry: {
    enabled: boolean;
    endpoint?: string;
  };

  // Scholarly API clients
  crossref?: {
    politeEmail: string;
  };

  openAlex?: {
    politeEmail: string;
  };

  semanticScholar?: {
    apiKey?: string;
  };

  unpaywall?: {
    email: string;
  };
}

/**
 * Validate required environment variables
 */
function validateEnv(): void {
  const required = [
    'OPENAI_API_KEY',
    'NEO4J_URI',
    'NEO4J_USER',
    'NEO4J_PASSWORD',
    'OPENSEARCH_NODE',
    'JWT_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new ConfigError(`Missing required environment variables: ${missing.join(', ')}`, {
      missing,
    });
  }
}

/**
 * Load and validate configuration
 */
export function loadConfig(): AppConfig {
  validateEnv();

  return {
    nodeEnv: process.env['NODE_ENV'] || 'development',
    port: parseInt(process.env['PORT'] || '3000', 10),
    logLevel: process.env['LOG_LEVEL'] || 'info',

    openai: {
      apiKey: process.env['OPENAI_API_KEY']!,
      model: process.env['OPENAI_MODEL'] || 'gpt-4-turbo-preview',
      embeddingModel: process.env['OPENAI_EMBEDDING_MODEL'] || 'text-embedding-3-small',
    },

    neo4j: {
      uri: process.env['NEO4J_URI']!,
      user: process.env['NEO4J_USER']!,
      password: process.env['NEO4J_PASSWORD']!,
    },

    opensearch: {
      node: process.env['OPENSEARCH_NODE']!,
      username: process.env['OPENSEARCH_USERNAME'] || 'admin',
      password: process.env['OPENSEARCH_PASSWORD'] || 'admin',
      indexPrefix: process.env['OPENSEARCH_INDEX_PREFIX'] || 'research',
    },

    redis: {
      host: process.env['REDIS_HOST'] || 'localhost',
      port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
      password: process.env['REDIS_PASSWORD'],
      db: parseInt(process.env['REDIS_DB'] || '0', 10),
    },

    s3: {
      endpoint: process.env['S3_ENDPOINT'] || 'http://localhost:9000',
      accessKeyId: process.env['S3_ACCESS_KEY_ID'] || 'minioadmin',
      secretAccessKey: process.env['S3_SECRET_ACCESS_KEY'] || 'minioadmin',
      bucketName: process.env['S3_BUCKET_NAME'] || 'research-events',
      region: process.env['S3_REGION'] || 'us-east-1',
    },

    browserbase: process.env['BROWSERBASE_API_KEY']
      ? {
          apiKey: process.env['BROWSERBASE_API_KEY'],
          projectId: process.env['BROWSERBASE_PROJECT_ID'] || '',
        }
      : undefined,

    fetch: {
      userAgent:
        process.env['FETCH_USER_AGENT'] || 'DeepResearchBot/1.0 (+https://example.com/bot)',
      rateLimitDefault: parseInt(process.env['FETCH_RATE_LIMIT_DEFAULT'] || '1', 10),
      timeoutMs: parseInt(process.env['FETCH_TIMEOUT_MS'] || '30000', 10),
      maxRetries: parseInt(process.env['FETCH_MAX_RETRIES'] || '3', 10),
    },

    security: {
      jwtSecret: process.env['JWT_SECRET']!,
      sessionSecret: process.env['SESSION_SECRET'] || 'change-me-in-production',
      corsOrigin: process.env['CORS_ORIGIN'] || 'http://localhost:5173',
    },

    telemetry: {
      enabled: process.env['ENABLE_TELEMETRY'] === 'true',
      endpoint: process.env['TELEMETRY_ENDPOINT'],
    },

    crossref: process.env['CROSSREF_POLITE_EMAIL']
      ? {
          politeEmail: process.env['CROSSREF_POLITE_EMAIL'],
        }
      : undefined,

    openAlex: process.env['OPENALEX_POLITE_EMAIL']
      ? {
          politeEmail: process.env['OPENALEX_POLITE_EMAIL'],
        }
      : undefined,

    semanticScholar: process.env['SEMANTICSCHOLAR_API_KEY']
      ? {
          apiKey: process.env['SEMANTICSCHOLAR_API_KEY'],
        }
      : undefined,

    unpaywall: process.env['UNPAYWALL_EMAIL']
      ? {
          email: process.env['UNPAYWALL_EMAIL'],
        }
      : undefined,
  };
}

// Singleton config instance
export const config = loadConfig();
