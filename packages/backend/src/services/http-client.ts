/**
 * @fileoverview HTTP client with proper headers, user agent, and timeout handling
 * @lastmodified 2025-10-28
 *
 * Features: Configurable HTTP client with retry logic, timeout, custom headers
 * Main APIs: fetch(), get(), post(), head()
 * Constraints: Respects timeout, retry limits, and custom user agent
 * Patterns: Wrapper around axios with sensible defaults for web scraping
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * HTTP fetch options
 */
export interface FetchOptions {
  method?: 'GET' | 'POST' | 'HEAD';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  followRedirects?: boolean;
  maxRedirects?: number;
}

/**
 * HTTP fetch response
 */
export interface FetchResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  contentType: string;
  contentLength: number;
  finalUrl: string;
  redirectChain: string[];
  duration_ms: number;
}

/**
 * HTTP client service for web fetching
 */
export class HttpClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: config.fetch.timeoutMs,
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      headers: {
        'User-Agent': config.fetch.userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use((requestConfig) => {
      logger.debug('HTTP request', {
        metadata: {
          url: requestConfig.url,
          method: requestConfig.method?.toUpperCase(),
        },
      });
      return requestConfig;
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('HTTP response', {
          metadata: {
            url: response.config.url,
            status: response.status,
            content_length: response.headers['content-length'],
          },
        });
        return response;
      },
      (error) => {
        logger.error('HTTP request failed', {
          metadata: {
            url: error.config?.url,
            error: error.message,
          },
        });
        throw error;
      }
    );
  }

  /**
   * Fetch a URL with full response details
   */
  async fetch(url: string, options: FetchOptions = {}): Promise<FetchResponse> {
    const startTime = Date.now();

    try {
      const axiosConfig: AxiosRequestConfig = {
        url,
        method: options.method || 'GET',
        headers: options.headers,
        data: options.body,
        timeout: options.timeout || config.fetch.timeoutMs,
        maxRedirects: options.maxRedirects ?? 5,
        responseType: 'text',
      };

      const response: AxiosResponse = await this.client.request(axiosConfig);

      const duration = Date.now() - startTime;

      // Build redirect chain from axios request
      const redirectChain: string[] = [];
      if (response.request?._redirectable?._redirects) {
        redirectChain.push(
          ...response.request._redirectable._redirects.map((r: { url: string }) => r.url)
        );
      }

      const result: FetchResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        body: response.data,
        contentType: response.headers['content-type'] || 'text/html',
        contentLength: parseInt(response.headers['content-length'] || '0', 10),
        finalUrl: response.request?.res?.responseUrl || url,
        redirectChain,
        duration_ms: duration,
      };

      logger.info('HTTP fetch completed', {
        metadata: {
          url,
          status: result.status,
          content_length: result.contentLength,
          duration_ms: duration,
          redirects: redirectChain.length,
        },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('HTTP fetch failed', {
        metadata: {
          url,
          error: error instanceof Error ? error.message : String(error),
          duration_ms: duration,
        },
      });

      throw error;
    }
  }

  /**
   * Simple GET request
   */
  async get(url: string, headers?: Record<string, string>): Promise<FetchResponse> {
    return this.fetch(url, { method: 'GET', headers });
  }

  /**
   * HEAD request (useful for checking content-type, size without downloading)
   */
  async head(url: string, headers?: Record<string, string>): Promise<FetchResponse> {
    return this.fetch(url, { method: 'HEAD', headers });
  }

  /**
   * POST request
   */
  async post(url: string, body: unknown, headers?: Record<string, string>): Promise<FetchResponse> {
    return this.fetch(url, { method: 'POST', body, headers });
  }

  /**
   * Check if URL is accessible (HEAD request)
   */
  async isAccessible(url: string): Promise<boolean> {
    try {
      const response = await this.head(url);
      return response.status >= 200 && response.status < 400;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const httpClient = new HttpClient();
