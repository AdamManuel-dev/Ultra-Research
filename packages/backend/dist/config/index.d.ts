/**
 * @fileoverview Environment configuration loader with validation
 * @lastmodified 2025-10-28
 *
 * Features: Type-safe config loading, validation, and defaults
 * Main APIs: loadConfig(), config singleton
 * Constraints: Validates required env vars on startup, throws ConfigError if invalid
 * Patterns: Use config.get() to access values, supports .env files via dotenv
 */
/**
 * Application configuration interface
 */
export interface AppConfig {
    nodeEnv: string;
    port: number;
    logLevel: string;
    openai: {
        apiKey: string;
        model: string;
        embeddingModel: string;
    };
    neo4j: {
        uri: string;
        user: string;
        password: string;
    };
    opensearch: {
        node: string;
        username: string;
        password: string;
        indexPrefix: string;
    };
    redis: {
        host: string;
        port: number;
        password?: string;
        db: number;
    };
    s3: {
        endpoint: string;
        accessKeyId: string;
        secretAccessKey: string;
        bucketName: string;
        region: string;
    };
    browserbase?: {
        apiKey: string;
        projectId: string;
    };
    fetch: {
        userAgent: string;
        rateLimitDefault: number;
        timeoutMs: number;
        maxRetries: number;
    };
    security: {
        jwtSecret: string;
        sessionSecret: string;
        corsOrigin: string;
    };
    telemetry: {
        enabled: boolean;
        endpoint?: string;
    };
}
/**
 * Load and validate configuration
 */
export declare function loadConfig(): AppConfig;
export declare const config: AppConfig;
//# sourceMappingURL=index.d.ts.map