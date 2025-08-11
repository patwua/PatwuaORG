const { detectFormat } = require('../html');

describe('detectFormat', () => {
  test('detects html with BOM, doctype, and leading comments', () => {
    const payload = '\uFEFF<!--x--><!--y--><!doctype html><html><body></body></html>';
    expect(detectFormat(payload)).toBe('html');
  });

  test('detects mjml with BOM, doctype, and leading comments', () => {
    const payload = '\uFEFF<!doctype html><!--a--><mjml><body></body></mjml>';
    expect(detectFormat(payload)).toBe('mjml');
  });

  test('ignores tags inside comments', () => {
    const payload = '<!--<mjml></mjml>--><div>hi</div>';
    expect(detectFormat(payload)).toBe('html');
  });

  test('falls back to html if any tag present', () => {
    const payload = 'Hello <i>world</i>';
    expect(detectFormat(payload)).toBe('html');
  });

  test('returns richtext when no tags', () => {
    const payload = 'Just some text';
    expect(detectFormat(payload)).toBe('richtext');
  });
});
