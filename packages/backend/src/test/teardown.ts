/**
 * @fileoverview Jest teardown file for backend tests
 * @lastmodified 2025-10-28
 */

/**
 * Global teardown to clean up resources
 */
afterAll(async () => {
  // Clean up OpenSearch event indexer timer
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { opensearchEventIndexer } = require('../services/opensearch-event-indexer');
    await opensearchEventIndexer.close();
  } catch (error) {
    // Ignore if the module wasn't loaded
  }
});
