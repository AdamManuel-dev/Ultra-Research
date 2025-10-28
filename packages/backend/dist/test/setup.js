"use strict";
/**
 * @fileoverview Jest setup file for backend tests
 * @lastmodified 2025-10-28
 */
// Set required environment variables for testing
process.env['NODE_ENV'] = 'test';
process.env['OPENAI_API_KEY'] = 'test-key';
process.env['NEO4J_URI'] = 'bolt://localhost:7687';
process.env['NEO4J_USER'] = 'neo4j';
process.env['NEO4J_PASSWORD'] = 'password';
process.env['OPENSEARCH_NODE'] = 'http://localhost:9200';
process.env['JWT_SECRET'] = 'test-secret';
process.env['LOG_LEVEL'] = 'error'; // Reduce noise in tests
//# sourceMappingURL=setup.js.map