/**
 * @fileoverview Shared package entry point for Deep Research Cockpit
 * @lastmodified 2025-10-28T13:21:12Z
 *
 * Features: Exports all shared types, utilities, and constants for monorepo-wide use
 * Main APIs: Error classes (AppError, AuthError, etc.), ResearchEvent types, EventValidator
 * Constraints: All exports are type-safe with full TypeScript support
 * Patterns: Import from @deep-research/shared for consistent types across packages
 *
 * @example <caption>Import error classes</caption>
 * import { FetchError, ValidationError } from '@deep-research/shared';
 *
 * @example <caption>Import event types</caption>
 * import { ResearchEvent, eventValidator } from '@deep-research/shared';
 */

// Error types
export * from './types/errors';

// Event types
export * from './types/events';

// Validation
export * from './validation';
