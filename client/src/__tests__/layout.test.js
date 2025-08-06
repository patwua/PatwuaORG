const fs = require('fs');
const path = require('path');

describe('layout alignment', () => {
  let documentRoot;
  let styleContent;

  beforeAll(() => {
    const html = fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'index.html'), 'utf8');
    documentRoot = new DOMParser().parseFromString(html, 'text/html');
    styleContent = Array.from(documentRoot.querySelectorAll('style'))
      .map((s) => s.textContent)
      .join('\n');
  });

  test('header uses .header-container for alignment', () => {
    const container = documentRoot.querySelector('header .header-container');
    expect(container).not.toBeNull();
  });

  test('hero uses .hero-container and is padded/aligned', () => {
    const container = documentRoot.querySelector('.hero .hero-container');
    expect(container).not.toBeNull();
  });

  test('layout variables apply uniform spacing', () => {
    expect(styleContent).toContain('--content-max-width: 1200px');
    expect(styleContent).toContain('--content-padding: 0 1.5rem');
    ['.header-container', '.hero-container', '.container'].forEach((selector) => {
      const regex = new RegExp(
        `${selector}\\s*{[^}]*max-width:\\s*var\\(--content-max-width\\)[^}]*padding:\\s*var\\(--content-padding\\)`
      );
      expect(regex.test(styleContent)).toBe(true);
    });
  });
});
