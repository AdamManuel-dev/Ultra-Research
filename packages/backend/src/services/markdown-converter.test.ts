/**
 * @fileoverview Tests for markdown converter
 * @lastmodified 2025-11-05
 */

import { MarkdownConverter } from './markdown-converter';

describe('MarkdownConverter', () => {
  let converter: MarkdownConverter;

  beforeEach(() => {
    converter = new MarkdownConverter();
  });

  describe('convert()', () => {
    it('should convert simple HTML to Markdown', () => {
      const html = '<h1>Heading</h1><p>Paragraph</p>';
      const markdown = converter.convert(html);

      expect(markdown).toContain('# Heading');
      expect(markdown).toContain('Paragraph');
    });

    it('should convert links to Markdown format', () => {
      const html = '<a href="https://example.com">Link Text</a>';
      const markdown = converter.convert(html);

      expect(markdown).toContain('[Link Text](https://example.com)');
    });

    it('should convert lists to Markdown', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const markdown = converter.convert(html);

      expect(markdown).toContain('- Item 1');
      expect(markdown).toContain('- Item 2');
    });

    it('should convert emphasis and strong tags', () => {
      const html = '<em>italic</em> and <strong>bold</strong>';
      const markdown = converter.convert(html);

      expect(markdown).toContain('_italic_');
      expect(markdown).toContain('**bold**');
    });

    it('should remove script tags', () => {
      const html = '<p>Text</p><script>alert("bad")</script>';
      const markdown = converter.convert(html);

      expect(markdown).toContain('Text');
      expect(markdown).not.toContain('script');
      expect(markdown).not.toContain('alert');
    });

    it('should remove style tags', () => {
      const html = '<p>Text</p><style>.class {}</style>';
      const markdown = converter.convert(html);

      expect(markdown).toContain('Text');
      expect(markdown).not.toContain('style');
      expect(markdown).not.toContain('.class');
    });

    it('should handle code blocks', () => {
      const html = '<pre><code>const x = 1;</code></pre>';
      const markdown = converter.convert(html);

      expect(markdown).toContain('```');
      expect(markdown).toContain('const x = 1;');
    });

    it('should clean up excessive newlines', () => {
      const html = '<p>Para 1</p>\n\n\n\n<p>Para 2</p>';
      const markdown = converter.convert(html);

      const newlineCount = (markdown.match(/\n{3,}/g) || []).length;
      expect(newlineCount).toBe(0);
    });
  });

  describe('convertWithMetadata()', () => {
    it('should return markdown with statistics', () => {
      const html = `
        <h1>Title</h1>
        <p>This is a paragraph with <a href="https://example.com">a link</a>.</p>
        <img src="image.jpg" alt="Image">
        <h2>Subtitle</h2>
        <p>Another paragraph.</p>
      `;

      const result = converter.convertWithMetadata(html);

      expect(result.markdown).toBeTruthy();
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.linkCount).toBeGreaterThan(0);
      expect(result.imageCount).toBeGreaterThan(0);
      expect(result.headingCount).toBeGreaterThan(0);
    });

    it('should count words correctly', () => {
      const html = '<p>One two three four five</p>';
      const result = converter.convertWithMetadata(html);

      expect(result.wordCount).toBe(5);
    });

    it('should count links correctly', () => {
      const html = '<a href="link1">L1</a><a href="link2">L2</a><a href="link3">L3</a>';
      const result = converter.convertWithMetadata(html);

      expect(result.linkCount).toBe(3);
    });

    it('should count images correctly', () => {
      const html = '<img src="img1.jpg"><img src="img2.jpg">';
      const result = converter.convertWithMetadata(html);

      expect(result.imageCount).toBe(2);
    });

    it('should count headings correctly', () => {
      const html = '<h1>H1</h1><h2>H2</h2><h3>H3</h3>';
      const result = converter.convertWithMetadata(html);

      expect(result.headingCount).toBe(3);
    });
  });

  describe('convertClean()', () => {
    it('should remove navigation elements before conversion', () => {
      const html = `
        <nav>Navigation menu</nav>
        <header>Header content</header>
        <article>Main content</article>
        <footer>Footer content</footer>
      `;

      const markdown = converter.convertClean(html);

      expect(markdown).toContain('Main content');
      expect(markdown).not.toContain('Navigation menu');
      expect(markdown).not.toContain('Header content');
      expect(markdown).not.toContain('Footer content');
    });

    it('should remove comments before conversion', () => {
      const html = '<p>Text</p><!-- This is a comment -->';
      const markdown = converter.convertClean(html);

      expect(markdown).toContain('Text');
      expect(markdown).not.toContain('comment');
    });

    it('should handle complex nested structures', () => {
      const html = `
        <div>
          <nav><ul><li>Nav item</li></ul></nav>
          <main>
            <article>
              <h1>Article Title</h1>
              <p>Article content</p>
            </article>
          </main>
        </div>
      `;

      const markdown = converter.convertClean(html);

      expect(markdown).toContain('Article Title');
      expect(markdown).toContain('Article content');
      expect(markdown).not.toContain('Nav item');
    });
  });
});
