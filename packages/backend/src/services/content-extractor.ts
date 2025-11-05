/**
 * @fileoverview Content extraction service using Readability and Cheerio
 * @lastmodified 2025-11-05
 *
 * Features: Extract main content from HTML, clean up boilerplate, handle encoding
 * Main APIs: extract(), extractText(), extractMetadata()
 * Constraints: Handles malformed HTML, detects encoding, falls back gracefully
 * Patterns: Readability for article extraction, Cheerio for parsing
 */

import { Readability } from '@mozilla/readability';
import * as cheerio from 'cheerio';
import { decode } from 'iconv-lite';
import { JSDOM } from 'jsdom';

import { logger } from '../utils/logger';

/**
 * Extracted content result
 */
export interface ExtractedContent {
  title: string;
  content: string;
  textContent: string;
  excerpt: string;
  byline: string | null;
  dir: string | null;
  siteName: string | null;
  lang: string | null;
  publishedTime: string | null;
  length: number;
  metadata: {
    author?: string;
    description?: string;
    image?: string;
    keywords?: string[];
  };
}

/**
 * Content extractor using Mozilla Readability
 */
export class ContentExtractor {
  /**
   * Detect charset from HTML content
   */
  private detectCharset(html: string | Buffer): string {
    const htmlStr = typeof html === 'string' ? html : html.toString('utf-8');

    // Check for meta charset tag
    const charsetMatch = htmlStr.match(/<meta[^>]+charset\s*=\s*["']?([^"'\s/>]+)/i);
    if (charsetMatch?.[1]) {
      return charsetMatch[1].toLowerCase();
    }

    // Check for XML encoding declaration
    const xmlMatch = htmlStr.match(/<?xml[^>]+encoding\s*=\s*["']?([^"'\s?>]+)/i);
    if (xmlMatch?.[1]) {
      return xmlMatch[1].toLowerCase();
    }

    // Default to UTF-8
    return 'utf-8';
  }

  /**
   * Decode HTML content with proper charset
   */
  private decodeHtml(html: Buffer | string): string {
    if (typeof html === 'string') {
      return html;
    }

    const charset = this.detectCharset(html);

    try {
      return decode(html, charset);
    } catch (error) {
      logger.warn('Failed to decode with detected charset, falling back to UTF-8', {
        metadata: {
          charset,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      return decode(html, 'utf-8');
    }
  }

  /**
   * Extract metadata using Cheerio
   */
  private extractMetadata(html: string): ExtractedContent['metadata'] {
    const $ = cheerio.load(html);

    const metadata: ExtractedContent['metadata'] = {};

    // Open Graph metadata
    metadata.description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content');
    metadata.image = $('meta[property="og:image"]').attr('content');
    metadata.author =
      $('meta[name="author"]').attr('content') ||
      $('meta[property="article:author"]').attr('content');

    // Keywords
    const keywordsStr = $('meta[name="keywords"]').attr('content');
    if (keywordsStr) {
      metadata.keywords = keywordsStr.split(',').map((k) => k.trim());
    }

    return metadata;
  }

  /**
   * Extract main content from HTML
   */
  async extract(html: Buffer | string, url: string): Promise<ExtractedContent> {
    const startTime = Date.now();

    try {
      // Decode HTML
      const decodedHtml = this.decodeHtml(html);

      // Extract metadata first
      const metadata = this.extractMetadata(decodedHtml);

      // Create JSDOM instance for Readability
      const dom = new JSDOM(decodedHtml, { url });

      // Use Readability to extract article content
      const reader = new Readability(dom.window.document, {
        debug: false,
        charThreshold: 500, // Minimum characters for article
      });

      const article = reader.parse();

      if (!article) {
        // Fallback: use Cheerio to extract basic content
        logger.warn('Readability failed to extract article, using fallback', {
          metadata: { url },
        });

        const $ = cheerio.load(decodedHtml);

        // Remove script and style tags
        $('script, style, nav, header, footer, aside').remove();

        // Get text from body or main content
        const bodyText = $('body').text().trim();
        const title = $('title').text().trim() || $('h1').first().text().trim();

        const result: ExtractedContent = {
          title,
          content: `<p>${bodyText.substring(0, 5000)}</p>`,
          textContent: bodyText,
          excerpt: bodyText.substring(0, 200),
          byline: metadata.author || null,
          dir: null,
          siteName: null,
          lang: $('html').attr('lang') || null,
          publishedTime: null,
          length: bodyText.length,
          metadata,
        };

        logger.info('Content extracted (fallback)', {
          metadata: {
            url,
            length: result.length,
            duration_ms: Date.now() - startTime,
          },
        });

        return result;
      }

      // Use Readability results
      const result: ExtractedContent = {
        title: article.title ?? '',
        content: article.content ?? '',
        textContent: article.textContent ?? '',
        excerpt: article.excerpt ?? '',
        byline: article.byline ?? null,
        dir: article.dir ?? null,
        siteName: article.siteName ?? null,
        lang: article.lang ?? null,
        publishedTime: article.publishedTime ?? null,
        length: article.length ?? 0,
        metadata,
      };

      logger.info('Content extracted successfully', {
        metadata: {
          url,
          title: result.title,
          length: result.length,
          duration_ms: Date.now() - startTime,
        },
      });

      return result;
    } catch (error) {
      logger.error('Content extraction failed', {
        metadata: {
          url,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Extract only text content (no HTML)
   */
  async extractText(html: Buffer | string, url: string): Promise<string> {
    const extracted = await this.extract(html, url);
    return extracted.textContent;
  }

  /**
   * Extract only metadata
   */
  extractMetadataOnly(html: Buffer | string): ExtractedContent['metadata'] {
    const decodedHtml = this.decodeHtml(html);
    return this.extractMetadata(decodedHtml);
  }
}

// Singleton instance
export const contentExtractor = new ContentExtractor();
