const sanitizeHtml = require('sanitize-html');
const mjml2html = require('mjml');
const { minify } = require('html-minifier-terser');
const cheerio = require('cheerio');

const baseAllowedTags = sanitizeHtml.defaults.allowedTags.concat([
  'img','table','thead','tbody','tfoot','tr','td','th',
  'iframe','video','source','figure','figcaption','section','article','header','footer','p','div','span','h1','h2','h3','h4','h5','h6','html','head','body','title'
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
    return { tagName: 'a', attribs: { ...attribs, target: '_self', rel: 'noopener' } };
  }
  return { tagName, attribs };
}

function sanitize(html, { allowStyleTag = false } = {}) {
  const allowedTags = allowStyleTag ? baseAllowedTags.concat(['style']) : baseAllowedTags;
  return sanitizeHtml(html, {
    allowedTags, allowedAttributes, transformTags,
    allowedSchemesByTag: { img: ['http','https','data'] },
    disallowedTagsMode: 'discard',
    ...(allowStyleTag ? { allowVulnerableTags: true } : {})
  });
}

async function compileMjml(mjmlString) {
  const { html, errors } = mjml2html(mjmlString, { keepComments: false });
  if (errors?.length) throw new Error(errors.map(e => e.formattedMessage || e.message).join('\n'));
  const compact = await minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: false,
  });
  return compact;
}

function stripToText(html) {
  return html.replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
}

function detectFormat(payload = '') {
  let s = (payload || '').trim().replace(/^\uFEFF/, '');
  s = s.replace(/^<!doctype[^>]*>\s*/i, '');
  s = s.replace(/^<!--[\s\S]*?-->\s*/g, '');
  if (/^<\s*mjml[\s>]/i.test(s)) return 'mjml';
  if (/<\s*html[\s>]/i.test(s) || /^<\s*(div|section|table|p|body)[\s>]/i.test(s)) return 'html';
  if (/<[a-z][\s\S]*>/i.test(s)) return 'html';
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
