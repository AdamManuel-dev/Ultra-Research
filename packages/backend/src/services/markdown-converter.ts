/**
 * @fileoverview HTML to Markdown converter using Turndown
 * @lastmodified 2025-11-05
 *
 * Features: Convert HTML to clean Markdown, preserve links and structure
 * Main APIs: convert(), convertWithMetadata()
 * Constraints: Handles various HTML formats, cleans up unwanted elements
 * Patterns: Turndown for conversion with custom rules
 */

import TurndownService from 'turndown';

import { logger } from '../utils/logger';

/**
 * Markdown conversion result
 */
export interface MarkdownResult {
  markdown: string;
  wordCount: number;
  linkCount: number;
  imageCount: number;
  headingCount: number;
}

/**
 * HTML to Markdown converter
 */
export class MarkdownConverter {
  private turndown: TurndownService;

  constructor() {
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      fence: '```',
      emDelimiter: '_',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full',
    });

    // Add custom rules
    this.setupCustomRules();
  }

  /**
   * Setup custom conversion rules
   */
  private setupCustomRules() {
    // Remove script and style tags
    this.turndown.addRule('removeScriptsAndStyles', {
      filter: ['script', 'style', 'noscript'],
      replacement: () => '',
    });

    // Remove comments
    this.turndown.addRule('removeComments', {
      filter: (node) => node.nodeType === 8, // Comment node
      replacement: () => '',
    });

    // Handle code blocks better
    this.turndown.addRule('codeBlock', {
      filter: ['pre'],
      replacement: (content, node) => {
        const codeElement = (node as Element).querySelector('code');
        const language = codeElement?.getAttribute('class')?.replace('language-', '') || '';
        return `\n\n\`\`\`${language}\n${content}\n\`\`\`\n\n`;
      },
    });

    // Handle tables
    this.turndown.addRule('table', {
      filter: 'table',
      replacement: (content) => {
        // Simple table conversion (can be enhanced)
        return `\n\n${content}\n\n`;
      },
    });
  }

  /**
   * Convert HTML to Markdown
   */
  convert(html: string): string {
    try {
      const markdown = this.turndown.turndown(html);

      // Clean up excessive newlines
      const cleaned = markdown
        .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
        .replace(/^\s+|\s+$/g, '') // Trim whitespace
        .replace(/\n\n+$/g, '\n\n'); // Clean up end

      logger.debug('HTML converted to Markdown', {
        metadata: {
          input_length: html.length,
          output_length: cleaned.length,
        },
      });

      return cleaned;
    } catch (error) {
      logger.error('Markdown conversion failed', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Convert HTML to Markdown with metadata
   */
  convertWithMetadata(html: string): MarkdownResult {
    const markdown = this.convert(html);

    // Calculate statistics
    const wordCount = markdown.split(/\s+/).filter((w) => w.length > 0).length;
    const linkCount = (markdown.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
    const imageCount = (markdown.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || []).length;
    const headingCount = (markdown.match(/^#{1,6}\s/gm) || []).length;

    return {
      markdown,
      wordCount,
      linkCount,
      imageCount,
      headingCount,
    };
  }

  /**
   * Convert and clean HTML before conversion
   */
  convertClean(html: string): string {
    // Remove common unwanted elements before conversion
    let cleaned = html;

    // Remove script and style content (redundant but safe)
    cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove comments
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

    // Remove navigation, header, footer elements
    cleaned = cleaned.replace(/<(nav|header|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, '');

    return this.convert(cleaned);
  }
}

// Singleton instance
export const markdownConverter = new MarkdownConverter();
