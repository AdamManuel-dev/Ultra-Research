/**
 * @fileoverview Rate limiter with per-domain tracking and configurable limits
 * @lastmodified 2025-10-28
 *
 * Features: Per-domain rate limiting, request queuing, configurable limits
 * Main APIs: checkLimit(), waitForSlot(), setDomainLimit()
 * Constraints: Respects per-domain limits, tracks request timestamps
 * Patterns: Token bucket algorithm, sliding window rate limiting
 */

import { URL } from 'url';

import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Domain rate limit state
 */
interface DomainState {
  domain: string;
  requestTimestamps: number[];
  limit: number; // requests per second
  lastRequest: number;
}

/**
 * Rate limiter for HTTP requests
 */
export class RateLimiter {
  private domainStates: Map<string, DomainState>;

  private readonly defaultLimit: number;

  constructor(defaultLimit?: number) {
    this.domainStates = new Map();
    this.defaultLimit = defaultLimit || config.fetch.rateLimitDefault;
  }

  /**
   * Extract domain from URL
   */
  private static getDomain(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.host;
    } catch (error) {
      logger.error('Invalid URL for rate limiting', {
        metadata: {
          url,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      return 'unknown';
    }
  }

  /**
   * Get or create domain state
   */
  private getState(domain: string): DomainState {
    if (!this.domainStates.has(domain)) {
      this.domainStates.set(domain, {
        domain,
        requestTimestamps: [],
        limit: this.defaultLimit,
        lastRequest: 0,
      });
    }
    return this.domainStates.get(domain)!;
  }

  /**
   * Set rate limit for a specific domain
   */
  setDomainLimit(url: string, requestsPerSecond: number): void {
    const domain = RateLimiter.getDomain(url);
    const state = this.getState(domain);
    state.limit = requestsPerSecond;

    logger.info('Domain rate limit set', {
      metadata: {
        domain,
        limit: requestsPerSecond,
      },
    });
  }

  /**
   * Check if a request can be made now
   */
  canMakeRequest(url: string): boolean {
    const domain = RateLimiter.getDomain(url);
    const state = this.getState(domain);
    const now = Date.now();

    // Clean old timestamps (older than 1 second)
    state.requestTimestamps = state.requestTimestamps.filter((timestamp) => now - timestamp < 1000);

    // Check if under limit
    return state.requestTimestamps.length < state.limit;
  }

  /**
   * Record a request
   */
  recordRequest(url: string): void {
    const domain = RateLimiter.getDomain(url);
    const state = this.getState(domain);
    const now = Date.now();

    state.requestTimestamps.push(now);
    state.lastRequest = now;

    // Clean old timestamps
    state.requestTimestamps = state.requestTimestamps.filter((timestamp) => now - timestamp < 1000);

    logger.debug('Request recorded', {
      metadata: {
        domain,
        requests_in_window: state.requestTimestamps.length,
        limit: state.limit,
      },
    });
  }

  /**
   * Wait until a request can be made
   */
  async waitForSlot(url: string): Promise<void> {
    const domain = RateLimiter.getDomain(url);
    const state = this.getState(domain);

    while (!this.canMakeRequest(url)) {
      const now = Date.now();
      const oldestTimestamp = state.requestTimestamps[0];
      if (!oldestTimestamp) break; // No timestamps, shouldn't happen
      const waitTime = 1000 - (now - oldestTimestamp);

      if (waitTime > 0) {
        logger.debug('Rate limit wait', {
          metadata: {
            domain,
            wait_ms: waitTime,
            requests_in_window: state.requestTimestamps.length,
            limit: state.limit,
          },
        });

        await new Promise((resolve) => {
          setTimeout(resolve, waitTime);
        });
      }

      // Clean old timestamps
      const currentNow = Date.now();
      state.requestTimestamps = state.requestTimestamps.filter(
        (timestamp) => currentNow - timestamp < 1000
      );
    }
  }

  /**
   * Check and wait if needed, then record request
   */
  async acquire(url: string): Promise<void> {
    await this.waitForSlot(url);
    this.recordRequest(url);
  }

  /**
   * Get current rate limit stats for a domain
   */
  getStats(url: string): {
    domain: string;
    limit: number;
    current_requests: number;
    last_request_ms_ago: number;
  } {
    const domain = RateLimiter.getDomain(url);
    const state = this.getState(domain);
    const now = Date.now();

    // Clean old timestamps
    state.requestTimestamps = state.requestTimestamps.filter((timestamp) => now - timestamp < 1000);

    return {
      domain,
      limit: state.limit,
      current_requests: state.requestTimestamps.length,
      last_request_ms_ago: state.lastRequest > 0 ? now - state.lastRequest : -1,
    };
  }

  /**
   * Get all domain stats
   */
  getAllStats(): Array<{
    domain: string;
    limit: number;
    current_requests: number;
    last_request_ms_ago: number;
  }> {
    return Array.from(this.domainStates.entries()).map(([domain, state]) => {
      const now = Date.now();
      const filteredTimestamps = state.requestTimestamps.filter(
        (timestamp) => now - timestamp < 1000
      );
      // eslint-disable-next-line no-param-reassign
      state.requestTimestamps = filteredTimestamps;

      return {
        domain,
        limit: state.limit,
        current_requests: state.requestTimestamps.length,
        last_request_ms_ago: state.lastRequest > 0 ? now - state.lastRequest : -1,
      };
    });
  }

  /**
   * Reset rate limit state for a domain
   */
  reset(url?: string): void {
    if (url) {
      const domain = RateLimiter.getDomain(url);
      this.domainStates.delete(domain);
      logger.info('Rate limit reset', { metadata: { domain } });
    } else {
      this.domainStates.clear();
      logger.info('All rate limits reset');
    }
  }

  /**
   * Apply robots.txt crawl delay if specified
   */
  applyRobotsCrawlDelay(url: string, crawlDelaySeconds: number): void {
    if (crawlDelaySeconds > 0) {
      // Convert crawl delay to requests per second
      const requestsPerSecond = 1 / crawlDelaySeconds;
      this.setDomainLimit(url, requestsPerSecond);

      logger.info('Applied robots.txt crawl delay', {
        metadata: {
          domain: RateLimiter.getDomain(url),
          crawl_delay_seconds: crawlDelaySeconds,
          requests_per_second: requestsPerSecond,
        },
      });
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();
