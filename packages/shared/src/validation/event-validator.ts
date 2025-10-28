/**
 * @fileoverview Event validator using Ajv and JSON Schema
 * @lastmodified 2025-10-28
 *
 * Features: Validates ResearchEvent objects against JSON Schema, provides detailed error messages
 * Main APIs: EventValidator class with validate() method
 * Constraints: Throws ValidationError on invalid events
 * Patterns: Singleton pattern, caches compiled schema for performance
 */

import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { ResearchEvent } from '../types/events';
import { ValidationError } from '../types/errors';
import { eventSchema } from './event-schema';

/**
 * Event validator with compiled JSON Schema
 */
export class EventValidator {
  private ajv: Ajv;
  private validateFn: ReturnType<Ajv['compile']>;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: true });
    addFormats(this.ajv);
    this.validateFn = this.ajv.compile(eventSchema);
  }

  /**
   * Validate an event against the schema
   * @throws ValidationError if event is invalid
   */
  validate(event: unknown): asserts event is ResearchEvent {
    const valid = this.validateFn(event);

    if (!valid) {
      const errors = this.validateFn.errors || [];
      const errorMessages = this.formatErrors(errors);

      throw new ValidationError(
        `Event validation failed: ${errorMessages.join('; ')}`,
        this.getErrorFields(errors),
        {
          errors: errors.map((e) => ({
            field: e.instancePath,
            message: e.message || 'unknown error',
            params: e.params,
          })),
        }
      );
    }
  }

  /**
   * Format validation errors into readable messages
   */
  private formatErrors(errors: ErrorObject[]): string[] {
    return errors.map((error) => {
      const field = error.instancePath || 'root';
      const message = error.message || 'validation failed';
      return `${field}: ${message}`;
    });
  }

  /**
   * Extract field names from errors
   */
  private getErrorFields(errors: ErrorObject[]): string[] {
    return errors
      .map((e) => {
        const path = e.instancePath.replace(/^\//, '').replace(/\//g, '.');
        return path || 'root';
      })
      .filter((field, index, self) => self.indexOf(field) === index);
  }

  /**
   * Check if an event is valid without throwing
   */
  isValid(event: unknown): event is ResearchEvent {
    try {
      this.validate(event);
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const eventValidator = new EventValidator();
