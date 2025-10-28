/**
 * @fileoverview robots.txt parser and compliance checker
 * @lastmodified 2025-10-28
 *
 * Features: Parse robots.txt, check URL allowance, respect crawl delay
 * Main APIs: isAllowed(), getCrawlDelay(), parse()
 * Constraints: Follows robots.txt specification, caches parsed rules
 * Patterns: Per-domain rule caching, user-agent matching
 */

import { URL } from 'url';

import { logger } from '../utils/logger';

import { httpClient } from './http-client';

/**
 * Robots.txt rule
 */
interface RobotRule {
  userAgent: string;
  allows: string[];
  disallows: string[];
  crawlDelay?: number;
  sitemaps: string[];
}

/**
 * Parsed robots.txt
 */
interface RobotsTxt {
  rules: RobotRule[];
  sitemaps: string[];
  parsed_at: string;
  url: string;
}

/**
 * Robots.txt parser and compliance checker
 */
export class RobotsParser {
  private cache: Map<string, RobotsTxt>;

  private readonly cacheMaxAge = 86400000; // 24 hours

  constructor() {
    this.cache = new Map();
  }

  /**
   * Get robots.txt URL for a domain
   */
  private getRobotsTxtUrl(url: string): string {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}/robots.txt`;
  }

  /**
   * Get domain key for caching
   */
  private getDomainKey(url: string): string {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  }

  /**
   * Fetch and parse robots.txt for a domain
   */
  async fetchAndParse(url: string): Promise<RobotsTxt> {
    const robotsUrl = this.getRobotsTxtUrl(url);
    const domainKey = this.getDomainKey(url);

    // Check cache
    const cached = this.cache.get(domainKey);
    if (cached) {
      const age = Date.now() - new Date(cached.parsed_at).getTime();
      if (age < this.cacheMaxAge) {
        logger.debug('Robots.txt cache hit', { metadata: { domain: domainKey } });
        return cached;
      }
    }

    try {
      const response = await httpClient.get(robotsUrl);

      if (response.status !== 200) {
        // If robots.txt doesn't exist, allow all
        const emptyRobots: RobotsTxt = {
          rules: [],
          sitemaps: [],
          parsed_at: new Date().toISOString(),
          url: robotsUrl,
        };
        this.cache.set(domainKey, emptyRobots);
        return emptyRobots;
      }

      const parsed = this.parse(response.body, robotsUrl);
      this.cache.set(domainKey, parsed);

      logger.info('Robots.txt fetched and parsed', {
        metadata: {
          domain: domainKey,
          rules: parsed.rules.length,
          sitemaps: parsed.sitemaps.length,
        },
      });

      return parsed;
    } catch (error) {
      logger.warn('Failed to fetch robots.txt, allowing all', {
        metadata: {
          domain: domainKey,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      // On error, allow all
      const emptyRobots: RobotsTxt = {
        rules: [],
        sitemaps: [],
        parsed_at: new Date().toISOString(),
        url: robotsUrl,
      };
      this.cache.set(domainKey, emptyRobots);
      return emptyRobots;
    }
  }

  /**
   * Parse robots.txt content
   */
  parse(content: string, url: string): RobotsTxt {
    const lines = content.split('\n').map((line) => line.trim());

    const rules: RobotRule[] = [];
    const globalSitemaps: string[] = [];

    let currentRule: RobotRule | null = null;

    for (const line of lines) {
      // Skip comments and empty lines
      if (line.startsWith('#') || line.length === 0) {
        continue;
      }

      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const directive = line.slice(0, colonIndex).trim().toLowerCase();
      const value = line.slice(colonIndex + 1).trim();

      switch (directive) {
        case 'user-agent':
          // Start a new rule
          if (currentRule) {
            rules.push(currentRule);
          }
          currentRule = {
            userAgent: value.toLowerCase(),
            allows: [],
            disallows: [],
            sitemaps: [],
          };
          break;

        case 'allow':
          if (currentRule && value) {
            currentRule.allows.push(value);
          }
          break;

        case 'disallow':
          if (currentRule && value) {
            currentRule.disallows.push(value);
          }
          break;

        case 'crawl-delay':
          if (currentRule) {
            currentRule.crawlDelay = parseFloat(value);
          }
          break;

        case 'sitemap':
          globalSitemaps.push(value);
          if (currentRule) {
            currentRule.sitemaps.push(value);
          }
          break;

        default:
          break;
      }
    }

    // Add last rule
    if (currentRule) {
      rules.push(currentRule);
    }

    return {
      rules,
      sitemaps: globalSitemaps,
      parsed_at: new Date().toISOString(),
      url,
    };
  }

  /**
   * Check if a URL is allowed to be crawled
   */
  async isAllowed(url: string, userAgent: string = 'DeepResearchBot'): Promise<boolean> {
    try {
      const robotsTxt = await this.fetchAndParse(url);

      if (robotsTxt.rules.length === 0) {
        // No robots.txt or empty, allow all
        return true;
      }

      const parsed = new URL(url);
      const path = parsed.pathname + parsed.search;

      // Find matching user-agent rules (specific match or wildcard)
      const matchingRules = robotsTxt.rules.filter(
        (rule) =>
          rule.userAgent === userAgent.toLowerCase() ||
          rule.userAgent === '*' ||
          userAgent.toLowerCase().includes(rule.userAgent)
      );

      if (matchingRules.length === 0) {
        // No matching rules, allow
        return true;
      }

      // Check rules in order (most specific first)
      for (const rule of matchingRules) {
        // Check allows first (more specific)
        for (const allow of rule.allows) {
          if (this.matchesPattern(path, allow)) {
            return true;
          }
        }

        // Then check disallows
        for (const disallow of rule.disallows) {
          if (this.matchesPattern(path, disallow)) {
            return false;
          }
        }
      }

      // If no explicit disallow, allow
      return true;
    } catch (error) {
      logger.error('Error checking robots.txt', {
        metadata: {
          url,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      // On error, be conservative and disallow
      return false;
    }
  }

  /**
   * Get crawl delay for a domain
   */
  async getCrawlDelay(url: string, userAgent: string = 'DeepResearchBot'): Promise<number | null> {
    try {
      const robotsTxt = await this.fetchAndParse(url);

      const matchingRules = robotsTxt.rules.filter(
        (rule) =>
          rule.userAgent === userAgent.toLowerCase() ||
          rule.userAgent === '*' ||
          userAgent.toLowerCase().includes(rule.userAgent)
      );

      for (const rule of matchingRules) {
        if (rule.crawlDelay !== undefined) {
          return rule.crawlDelay;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Match a path against a robots.txt pattern
   */
  private matchesPattern(path: string, pattern: string): boolean {
    if (pattern === '/') {
      return true;
    }

    // Convert robots.txt pattern to regex
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape regex chars
      .replace(/\*/g, '.*'); // * matches anything

    const regex = new RegExp(`^${regexPattern}`);
    return regex.test(path);
  }

  /**
   * Clear cache for a domain
   */
  clearCache(url?: string): void {
    if (url) {
      const domainKey = this.getDomainKey(url);
      this.cache.delete(domainKey);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get sitemaps for a domain
   */
  async getSitemaps(url: string): Promise<string[]> {
    try {
      const robotsTxt = await this.fetchAndParse(url);
      return robotsTxt.sitemaps;
    } catch {
      return [];
    }
  }
}

// Singleton instance
export const robotsParser = new RobotsParser();
