/**
 * @fileoverview JSON Schema for event validation
 * @lastmodified 2025-10-28
 *
 * Features: JSON Schema definition for ResearchEvent validation
 * Main APIs: eventSchema constant for Ajv validator
 * Constraints: Must match ResearchEvent interface exactly
 * Patterns: Used by event validator to ensure all events are well-formed
 */
export declare const eventSchema: {
    $schema: string;
    type: string;
    required: string[];
    properties: {
        ts: {
            type: string;
            format: string;
            description: string;
        };
        run_id: {
            type: string;
            minLength: number;
            description: string;
        };
        step_id: {
            type: string;
            minimum: number;
            description: string;
        };
        agent: {
            type: string;
            enum: string[];
            description: string;
        };
        action: {
            type: string;
            description: string;
        };
        input: {
            type: string;
            description: string;
        };
        output: {
            type: string;
            description: string;
        };
        artifacts: {
            type: string;
            properties: {
                urls: {
                    type: string;
                    items: {
                        type: string;
                    };
                };
                document_ids: {
                    type: string;
                    items: {
                        type: string;
                    };
                };
                node_ids: {
                    type: string;
                    items: {
                        type: string;
                    };
                };
                edge_ids: {
                    type: string;
                    items: {
                        type: string;
                    };
                };
                file_paths: {
                    type: string;
                    items: {
                        type: string;
                    };
                };
            };
            description: string;
        };
        source: {
            type: string;
            required: string[];
            properties: {
                type: {
                    type: string;
                    enum: string[];
                };
                value: {
                    type: string;
                };
            };
            description: string;
        };
        cost: {
            type: string;
            required: string[];
            properties: {
                usd: {
                    type: string;
                    minimum: number;
                };
                tokens: {
                    type: string;
                    required: string[];
                    properties: {
                        input: {
                            type: string;
                            minimum: number;
                        };
                        output: {
                            type: string;
                            minimum: number;
                        };
                    };
                };
                compute_ms: {
                    type: string;
                    minimum: number;
                };
            };
            description: string;
        };
        decision: {
            type: string;
            required: string[];
            properties: {
                reason: {
                    type: string;
                };
                score: {
                    type: string;
                };
                alternatives: {
                    type: string;
                    items: {
                        type: string;
                        required: string[];
                        properties: {
                            option: {
                                type: string;
                            };
                            score: {
                                type: string;
                            };
                        };
                    };
                };
            };
            description: string;
        };
        error: {
            type: string;
            required: string[];
            properties: {
                message: {
                    type: string;
                };
                code: {
                    type: string;
                };
                stack: {
                    type: string;
                };
            };
            description: string;
        };
        metadata: {
            type: string;
            description: string;
        };
    };
    additionalProperties: boolean;
};
//# sourceMappingURL=event-schema.d.ts.map