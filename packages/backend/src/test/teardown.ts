/**
 * @fileoverview Jest teardown file for backend tests
 * @lastmodified 2025-11-05
 */

import { opensearchEventIndexer } from '../services/opensearch-event-indexer';

/**
 * Global teardown to clean up resources
 */
afterAll(async () => {
  // Clean up OpenSearch event indexer timer
  try {
    await opensearchEventIndexer.close();
  } catch (error) {
    // Ignore if the module wasn't loaded
  }
});
