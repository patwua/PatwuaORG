const { normalize, normalizeTag, extractHashtagsFromHtml, extractHashtagsFromText } = require('../tags');

describe('tag utils', () => {
  test('normalizeTag cleans and filters input', () => {
    expect(normalizeTag('#We Are!')).toBe('we-are');
    expect(normalizeTag('div')).toBeNull();
    expect(normalizeTag('#ffffff')).toBeNull();
  });

  test('normalize removes duplicates and limits', () => {
    const tags = normalize(['#One', 'two', 'two', 'style', '#0px']);
    expect(tags).toEqual(['one', 'two']);
  });

  test('extract hashtags from html and text', () => {
    const html = '<p>#Alpha and <span>#Beta</span></p>';
    expect(extractHashtagsFromHtml(html)).toEqual(['alpha','beta']);
    const text = 'Hello #Gamma world #delta!';
    expect(extractHashtagsFromText(text)).toEqual(['gamma','delta']);
  });

  test('ignores css ids and colors in html', () => {
    const html = '<style>#outlook{color:#ffffff}</style><p>#Hello <span style="color:#000000">world</span></p>';
    expect(extractHashtagsFromHtml(html)).toEqual(['hello']);
  });
});
