const sanitizeHtml = require('sanitize-html');
const mjml2html = require('mjml');

const allowedTags = sanitizeHtml.defaults.allowedTags.concat([
  'img','table','thead','tbody','tfoot','tr','td','th','iframe','section','article','header','footer','figure','figcaption','video','source','style'
]);

// Keep it strict but email-friendly: allow inline styles, table attrs, links/images
const allowedAttributes = {
  '*': ['style','class','align','width','height','cellpadding','cellspacing','border','role','aria-*','data-*'],
  a: ['href','name','target','rel'],
  img: ['src','alt','width','height'],
  table: ['align','border','cellpadding','cellspacing','width','role'],
  td: ['align','valign','width','height','colspan','rowspan'],
  th: ['align','valign','width','height','colspan','rowspan'],
  iframe: ['src','width','height','frameborder','allow','allowfullscreen']
};

// Force safe anchors
function transformTags(tagName, attribs) {
  if (tagName === 'a') {
    return {
      tagName: 'a',
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noopener noreferrer nofollow'
      }
    };
  }
  return { tagName, attribs };
}

function sanitize(html) {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
    transformTags,
    // keep style tags if present in email HTML, but strip scripts
    allowedSchemesByTag: { img: ['http','https','data'] },
    disallowedTagsMode: 'discard',
    // Do NOT allow script
  });
}

function compileMjml(mjmlString) {
  const { html, errors } = mjml2html(mjmlString, { minify: true, keepComments: false });
  if (errors && errors.length) {
    const msg = errors.map(e => e.formattedMessage || e.message).join('\n');
    throw new Error(`MJML compile error:\n${msg}`);
  }
  return html;
}

function stripToText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = { sanitize, compileMjml, stripToText };
