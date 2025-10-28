/**
 * @fileoverview Event validator using Ajv and JSON Schema
 * @lastmodified 2025-10-28
 *
 * Features: Validates ResearchEvent objects against JSON Schema, provides detailed error messages
 * Main APIs: EventValidator class with validate() method
 * Constraints: Throws ValidationError on invalid events
 * Patterns: Singleton pattern, caches compiled schema for performance
 */
import { ResearchEvent } from '../types/events';
/**
 * Event validator with compiled JSON Schema
 */
export declare class EventValidator {
    private ajv;
    private validateFn;
    constructor();
    /**
     * Validate an event against the schema
     * @throws ValidationError if event is invalid
     */
    validate(event: unknown): asserts event is ResearchEvent;
    /**
     * Format validation errors into readable messages
     */
    private formatErrors;
    /**
     * Extract field names from errors
     */
    private getErrorFields;
    /**
     * Check if an event is valid without throwing
     */
    isValid(event: unknown): event is ResearchEvent;
}
export declare const eventValidator: EventValidator;
//# sourceMappingURL=event-validator.d.ts.map