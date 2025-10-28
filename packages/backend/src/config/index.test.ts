/**
 * @fileoverview Tests for configuration loader
 * @lastmodified 2025-10-28
 */

describe('Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should throw ConfigError when required env vars are missing', () => {
    // Save current values
    const savedKey = process.env['OPENAI_API_KEY'];
    const savedUri = process.env['NEO4J_URI'];

    // Clear required env vars
    delete process.env['OPENAI_API_KEY'];
    delete process.env['NEO4J_URI'];

    // Clear module cache to force reload
    delete require.cache[require.resolve('./index')];

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { loadConfig } = require('./index');
      loadConfig();
      fail('Should have thrown ConfigError');
    } catch (error) {
      // Check error properties instead of instanceof
      expect((error as Error).name).toBe('ConfigError');
      expect((error as Error).message).toContain('Missing required environment variables');
    } finally {
      // Restore values
      if (savedKey) process.env['OPENAI_API_KEY'] = savedKey;
      if (savedUri) process.env['NEO4J_URI'] = savedUri;
      // Clear module cache again
      delete require.cache[require.resolve('./index')];
    }
  });

  it('should load config with all required env vars', () => {
    process.env['OPENAI_API_KEY'] = 'test-key';
    process.env['NEO4J_URI'] = 'bolt://localhost:7687';
    process.env['NEO4J_USER'] = 'neo4j';
    process.env['NEO4J_PASSWORD'] = 'password';
    process.env['OPENSEARCH_NODE'] = 'http://localhost:9200';
    process.env['JWT_SECRET'] = 'test-secret';

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { loadConfig } = require('./index');
    const config = loadConfig();

    expect(config.openai.apiKey).toBe('test-key');
    expect(config.neo4j.uri).toBe('bolt://localhost:7687');
  });

  it('should apply default values for optional config', () => {
    process.env['OPENAI_API_KEY'] = 'test-key';
    process.env['NEO4J_URI'] = 'bolt://localhost:7687';
    process.env['NEO4J_USER'] = 'neo4j';
    process.env['NEO4J_PASSWORD'] = 'password';
    process.env['OPENSEARCH_NODE'] = 'http://localhost:9200';
    process.env['JWT_SECRET'] = 'test-secret';

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { loadConfig } = require('./index');
    const config = loadConfig();

    expect(config.port).toBe(3000);
    expect(config.logLevel).toBe('error');
    expect(config.fetch.rateLimitDefault).toBe(1);
  });
});
