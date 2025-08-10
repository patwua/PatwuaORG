const sanitizeHtml = require('sanitize-html');
const mjml2html = require('mjml');
const cheerio = require('cheerio');

const allowedTags = sanitizeHtml.defaults.allowedTags.concat([
  'img','table','thead','tbody','tfoot','tr','td','th',
  'iframe','video','source','figure','figcaption','section','article','header','footer','style'
]);

const allowedAttributes = {
  '*': ['style','class','align','width','height','cellpadding','cellspacing','border','role','aria-*','data-*'],
  a: ['href','name','target','rel'],
  img: ['src','alt','width','height','loading'],
  iframe: ['src','width','height','frameborder','allow','allowfullscreen'],
  video: ['src','poster','controls','autoplay','muted','loop','playsinline','width','height'],
  source: ['src','type']
};

function transformTags(tagName, attribs) {
  if (tagName === 'a') {
    return { tagName: 'a', attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer nofollow' } };
  }
  return { tagName, attribs };
}

function sanitize(html) {
  return sanitizeHtml(html, {
    allowedTags, allowedAttributes, transformTags,
    allowedSchemesByTag: { img: ['http','https','data'] },
    disallowedTagsMode: 'discard'
  });
}

function compileMjml(mjmlString) {
  const { html, errors } = mjml2html(mjmlString, { minify: true, keepComments: false });
  if (errors?.length) throw new Error(errors.map(e => e.formattedMessage || e.message).join('\n'));
  return html;
}

function stripToText(html) {
  return html.replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
}

function detectFormat(payload = '') {
  const s = (payload || '').trim();
  if (/^<\s*mjml[\s>]/i.test(s)) return 'mjml';
  if (/^<\s*html[\s>]/i.test(s) || /^<\s*(div|table|section|article|figure)[\s>]/i.test(s)) return 'html';
  return 'richtext';
}

function extractMedia(html) {
  const $ = cheerio.load(html || '');
  const images = [];
  $('img').each((_, el) => {
    const $el = $(el);
    images.push({
      url: $el.attr('src'),
      alt: $el.attr('alt') || '',
      width: Number($el.attr('width')) || null,
      height: Number($el.attr('height')) || null,
      cover: $el.attr('data-cover') === 'true',
    });
  });
  const videos = [];
  $('iframe,video').each((_, el) => {
    const $el = $(el);
    const tag = $el[0].tagName;
    videos.push({
      type: tag,
      url: tag === 'iframe' ? $el.attr('src') : $el.attr('src'),
      poster: $el.attr('poster') || null,
    });
  });
  return { images, videos };
}

function chooseCover({ images, videos }) {
  // 1) explicit data-cover
  const explicit = images.find(i => i.cover && i.url);
  if (explicit) return explicit.url;
  // 2) first “large-ish” image
  const large = images.find(i => i.url && (i.width >= 480 || !i.width));
  if (large) return large.url;
  // 3) fall back to video poster if present
  const vposter = videos.find(v => v.poster)?.poster;
  if (vposter) return vposter;
  // 4) nothing
  return null;
}

module.exports = { sanitize, compileMjml, stripToText, detectFormat, extractMedia, chooseCover };
