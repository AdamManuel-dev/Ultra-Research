"use strict";
/**
 * @fileoverview JSON Schema for event validation
 * @lastmodified 2025-10-28
 *
 * Features: JSON Schema definition for ResearchEvent validation
 * Main APIs: eventSchema constant for Ajv validator
 * Constraints: Must match ResearchEvent interface exactly
 * Patterns: Used by event validator to ensure all events are well-formed
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventSchema = void 0;
exports.eventSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    required: ['ts', 'run_id', 'step_id', 'agent', 'action'],
    properties: {
        ts: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 timestamp',
        },
        run_id: {
            type: 'string',
            minLength: 1,
            description: 'Research run identifier',
        },
        step_id: {
            type: 'number',
            minimum: 0,
            description: 'Step within the run (sequential)',
        },
        agent: {
            type: 'string',
            enum: ['orchestrator', 'fetch', 'extract', 'index', 'graph', 'synthesis', 'system'],
            description: 'Component that emitted the event',
        },
        action: {
            type: 'string',
            description: 'Specific action taken',
        },
        input: {
            type: 'object',
            description: 'Input data for the action',
        },
        output: {
            type: 'object',
            description: 'Output data from the action',
        },
        artifacts: {
            type: 'object',
            properties: {
                urls: { type: 'array', items: { type: 'string' } },
                document_ids: { type: 'array', items: { type: 'string' } },
                node_ids: { type: 'array', items: { type: 'string' } },
                edge_ids: { type: 'array', items: { type: 'string' } },
                file_paths: { type: 'array', items: { type: 'string' } },
            },
            description: 'Artifacts generated',
        },
        source: {
            type: 'object',
            required: ['type', 'value'],
            properties: {
                type: {
                    type: 'string',
                    enum: ['url', 'query', 'document', 'node', 'command'],
                },
                value: { type: 'string' },
            },
            description: 'Source of the action',
        },
        cost: {
            type: 'object',
            required: ['usd'],
            properties: {
                usd: { type: 'number', minimum: 0 },
                tokens: {
                    type: 'object',
                    required: ['input', 'output'],
                    properties: {
                        input: { type: 'number', minimum: 0 },
                        output: { type: 'number', minimum: 0 },
                    },
                },
                compute_ms: { type: 'number', minimum: 0 },
            },
            description: 'Cost tracking',
        },
        decision: {
            type: 'object',
            required: ['reason'],
            properties: {
                reason: { type: 'string' },
                score: { type: 'number' },
                alternatives: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: ['option', 'score'],
                        properties: {
                            option: { type: 'string' },
                            score: { type: 'number' },
                        },
                    },
                },
            },
            description: 'Decision metadata for orchestrator',
        },
        error: {
            type: 'object',
            required: ['message'],
            properties: {
                message: { type: 'string' },
                code: { type: 'string' },
                stack: { type: 'string' },
            },
            description: 'Error information if action failed',
        },
        metadata: {
            type: 'object',
            description: 'Additional metadata',
        },
    },
    additionalProperties: false,
};
//# sourceMappingURL=event-schema.js.map