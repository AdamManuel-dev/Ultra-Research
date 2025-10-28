"use strict";
/**
 * @fileoverview Event validator using Ajv and JSON Schema
 * @lastmodified 2025-10-28
 *
 * Features: Validates ResearchEvent objects against JSON Schema, provides detailed error messages
 * Main APIs: EventValidator class with validate() method
 * Constraints: Throws ValidationError on invalid events
 * Patterns: Singleton pattern, caches compiled schema for performance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventValidator = exports.EventValidator = void 0;
const tslib_1 = require("tslib");
const ajv_1 = tslib_1.__importDefault(require("ajv"));
const ajv_formats_1 = tslib_1.__importDefault(require("ajv-formats"));
const errors_1 = require("../types/errors");
const event_schema_1 = require("./event-schema");
/**
 * Event validator with compiled JSON Schema
 */
class EventValidator {
    ajv;
    validateFn;
    constructor() {
        this.ajv = new ajv_1.default({ allErrors: true, strict: true });
        (0, ajv_formats_1.default)(this.ajv);
        this.validateFn = this.ajv.compile(event_schema_1.eventSchema);
    }
    /**
     * Validate an event against the schema
     * @throws ValidationError if event is invalid
     */
    validate(event) {
        const valid = this.validateFn(event);
        if (!valid) {
            const errors = this.validateFn.errors || [];
            const errorMessages = this.formatErrors(errors);
            throw new errors_1.ValidationError(`Event validation failed: ${errorMessages.join('; ')}`, this.getErrorFields(errors), {
                errors: errors.map((e) => ({
                    field: e.instancePath,
                    message: e.message || 'unknown error',
                    params: e.params,
                })),
            });
        }
    }
    /**
     * Format validation errors into readable messages
     */
    formatErrors(errors) {
        return errors.map((error) => {
            const field = error.instancePath || 'root';
            const message = error.message || 'validation failed';
            return `${field}: ${message}`;
        });
    }
    /**
     * Extract field names from errors
     */
    getErrorFields(errors) {
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
    isValid(event) {
        try {
            this.validate(event);
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.EventValidator = EventValidator;
// Singleton instance
exports.eventValidator = new EventValidator();
//# sourceMappingURL=event-validator.js.map