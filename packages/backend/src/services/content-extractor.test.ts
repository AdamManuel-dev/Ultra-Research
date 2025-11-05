/**
 * @fileoverview Tests for content extraction service
 * @lastmodified 2025-11-05
 */

import { ContentExtractor } from './content-extractor';

describe('ContentExtractor', () => {
  let extractor: ContentExtractor;

  beforeEach(() => {
    extractor = new ContentExtractor();
  });

  describe('extract()', () => {
    it('should extract content from simple HTML', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Article</title>
            <meta name="author" content="John Doe">
          </head>
          <body>
            <article>
              <h1>Main Title</h1>
              <p>This is the main content of the article. It contains several sentences to meet the character threshold for Readability extraction.</p>
              <p>This is another paragraph with more content to ensure the article is recognized as valid content.</p>
            </article>
          </body>
        </html>
      `;

      const result = await extractor.extract(html, 'https://example.com/article');

      expect(result.title).toBeTruthy();
      expect(result.content).toContain('Main Title');
      expect(result.textContent.length).toBeGreaterThan(0);
    });

    it('should extract metadata from HTML', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="og:title" content="OG Title">
            <meta property="og:description" content="OG Description">
            <meta name="author" content="Jane Smith">
            <meta name="keywords" content="test, article, example">
          </head>
          <body>
            <p>Content here with enough text to pass the character threshold for extraction. More text to ensure proper extraction.</p>
          </body>
        </html>
      `;

      const result = await extractor.extract(html, 'https://example.com');

      expect(result.title).toBe('OG Title');
      expect(result.metadata.description).toBe('OG Description');
      expect(result.metadata.author).toBe('Jane Smith');
      expect(result.metadata.keywords).toEqual(['test', 'article', 'example']);
    });

    it('should handle malformed HTML', async () => {
      const html = `
        <html>
          <body>
            <p>Unclosed tag
            <div>Another unclosed div
            <p>Some content that should still be extracted even with malformed HTML structure.</p>
          </body>
      `;

      await expect(extractor.extract(html, 'https://example.com')).resolves.toBeDefined();
    });

    it('should detect and handle different charsets', async () => {
      const html = Buffer.from(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body>
            <p>UTF-8 content with special characters: é, ñ, 中文</p>
          </body>
        </html>
      `, 'utf-8');

      const result = await extractor.extract(html, 'https://example.com');

      expect(result.textContent).toBeTruthy();
    });

    it('should fall back gracefully when Readability fails', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Short</title></head>
          <body><p>Too short</p></body>
        </html>
      `;

      const result = await extractor.extract(html, 'https://example.com');

      // Should still return something, even if using fallback
      expect(result).toBeDefined();
      expect(result.title).toBeTruthy();
    });
  });

  describe('extractText()', () => {
    it('should extract only text content', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <h1>Title</h1>
            <p>Paragraph one with enough content for extraction.</p>
            <p>Paragraph two with more content.</p>
          </body>
        </html>
      `;

      const text = await extractor.extractText(html, 'https://example.com');

      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
      expect(text).not.toContain('<');
      expect(text).not.toContain('>');
    });
  });

  describe('extractMetadataOnly()', () => {
    it('should extract metadata without full content extraction', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="og:title" content="Quick Title">
            <meta name="description" content="Quick Description">
          </head>
          <body>Content</body>
        </html>
      `;

      const metadata = extractor.extractMetadataOnly(html);

      // Note: title is in the ExtractedContent object, not in metadata
      expect(metadata.description).toBe('Quick Description');
    });

    it('should handle missing metadata gracefully', () => {
      const html = '<html><body>No metadata</body></html>';

      const metadata = extractor.extractMetadataOnly(html);

      expect(metadata).toBeDefined();
    });
  });
});
