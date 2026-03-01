import { describe, it, expect } from 'vitest';
import { renderInlineMarkdown } from '../utils/markdown';

describe('renderInlineMarkdown', () => {
  it('renders bold text', () => {
    expect(renderInlineMarkdown('**hello**')).toBe('<strong>hello</strong>');
  });

  it('renders italic text', () => {
    expect(renderInlineMarkdown('*world*')).toBe('<em>world</em>');
  });

  it('renders inline code', () => {
    expect(renderInlineMarkdown('use `npm install`')).toBe('use <code>npm install</code>');
  });

  it('renders strikethrough', () => {
    expect(renderInlineMarkdown('~~old~~')).toBe('<del>old</del>');
  });

  it('renders links', () => {
    const result = renderInlineMarkdown('[click](https://example.com)');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
    expect(result).toContain('>click</a>');
  });

  it('escapes HTML entities', () => {
    expect(renderInlineMarkdown('<script>alert("xss")</script>')).not.toContain('<script>');
    expect(renderInlineMarkdown('&')).toContain('&amp;');
  });

  it('handles mixed formatting', () => {
    const result = renderInlineMarkdown('**bold** and *italic* with `code`');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<em>italic</em>');
    expect(result).toContain('<code>code</code>');
  });

  it('returns plain text when no markdown', () => {
    expect(renderInlineMarkdown('just text')).toBe('just text');
  });
});
