import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { uploadToCloudinary } from '@/lib/upload';
import { useAuth } from '@/context/AuthContext';

type Persona = { _id: string; name: string };

function localDetect(s: string): 'richtext'|'html'|'mjml' {
  let t = s.trim().replace(/^\uFEFF/, '').replace(/^<!doctype[^>]*>/i,'').replace(/^<!--[\s\S]*?-->/,'').trim();
  if (/^<\s*mjml[\s>]/i.test(t)) return 'mjml';
  if (/<\s*html[\s>]/i.test(t) || /^<\s*(div|section|table|p|body)[\s>]/i.test(t) || /<[a-z][\s\S]*>/i.test(t)) return 'html';
  return 'richtext';
}

export default function PostEditor() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); // plain/HTML/MJML
  const [detected, setDetected] = useState<'richtext'|'html'|'mjml'>('richtext');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personaId, setPersonaId] = useState<string>('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [coverSuggested, setCoverSuggested] = useState<string | null>(null);
  const [images, setImages] = useState<{url?:string}[]>([]);
  const [videos, setVideos] = useState<{poster?:string}[]>([]);
  const [coverOverride, setCoverOverride] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  // load personas for selector
  useEffect(() => {
    if (!open) return
    api.get('/personas?owner=me')
      .then(({ data }) => setPersonas(Array.isArray(data) ? data : (data.personas || [])))
      .catch(() => {})
  }, [open])

  function resetAll() {
    setTitle(''); setContent(''); setPreviewHtml(null); setCoverSuggested(null);
    setImages([]); setVideos([]); setCoverOverride(null); setError(null);
    setDetected('richtext'); setPersonaId('');
  }

  async function doPreview() {
    setBusy(true); setError(null);
    try {
      const { data } = await api.post('/posts/preview', { content });
      setPreviewHtml(data.html);
      setImages(data.media?.images || []);
      setVideos(data.media?.videos || []);
      setCoverSuggested(data.coverSuggested || null);
    } catch (e:any) {
      setError(e?.response?.data?.error || 'Preview failed');
    } finally { setBusy(false); }
  }

  async function publish() {
    setBusy(true); setError(null);
    try {
      const payload: any = { title, content };
      if (personaId) payload.personaId = personaId;
      if (coverOverride) payload.coverImage = coverOverride;
      const { data } = await api.post('/posts', payload);
      setOpen(false);
      resetAll();
      window.location.href = `/p/${data.post.slug}`;
    } catch (e:any) {
      setError(e?.response?.data?.error || 'Publish failed');
    } finally { setBusy(false); }
  }

  function insertAround(openTag: string, closeTag: string) {
    const el = bodyRef.current!;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const next = value.slice(0, s) + openTag + value.slice(s, e) + closeTag + value.slice(e);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = s + openTag.length + (e - s) + closeTag.length;
      el.setSelectionRange(pos, pos);
    });
  }

  async function onPickFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    const url = await uploadToCloudinary(file);
    const isVideo = /^video\//.test(file.type);
    const snippet = isVideo
      ? `<video src="${url}" controls poster="" style="max-width:100%;height:auto"></video>`
      : `<img src="${url}" alt="" style="max-width:100%;height:auto" />`;
    const el = bodyRef.current!;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const next = value.slice(0, s) + snippet + value.slice(e);
    setContent(next);
    ev.target.value = '';
    requestAnimationFrame(() => {
      el.focus(); el.setSelectionRange(s + snippet.length, s + snippet.length);
    });
  }

  const cover = coverOverride || coverSuggested || null;

  // Floating action button (original one): open modal
  return (
    <>
      {/* Floating button — keep your existing classes/placement */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 rounded-full bg-red-600 text-white px-5 py-3 shadow-lg"
      >
        New Post
      </button>

      {!open ? null : (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl ring-1 ring-black/10">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <div className="font-semibold">Create Post</div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">Detected: <b>{detected}</b></span>
                <button onClick={() => { setOpen(false); resetAll(); }} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-auto">
              {/* Title */}
              <div>
                <label className="block text-sm mb-1">Title</label>
                <input
                  value={title}
                  onChange={e=>setTitle(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Give it a title"
                />
              </div>

              {/* Persona */}
              <div>
                <label className="block text-sm mb-1">Posting as</label>
                <select value={personaId} onChange={e => setPersonaId(e.target.value)} className="border rounded px-2 py-2">
                  <option value="">(default persona)</option>
                  {personas.map((p: any) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Body textarea */}
              <div>
                <label className="block text-sm mb-1">Body (plain text, HTML, or MJML)</label>
                <textarea
                  ref={bodyRef}
                  value={content}
                  onChange={e => { setContent(e.target.value); setDetected(localDetect(e.target.value)); }}
                  rows={12}
                  className="w-full border rounded px-3 py-2 font-mono"
                  placeholder="Write here. Use #hashtags to tag your post automatically."
                />
              </div>

              {/* Tiny helper bar */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <button className="px-2 py-1 border rounded" onClick={() => insertAround('<strong>', '</strong>')}>B</button>
                <button className="px-2 py-1 border rounded italic" onClick={() => insertAround('<em>', '</em>')}>I</button>
                <button className="px-2 py-1 border rounded underline" onClick={() => insertAround('<u>', '</u>')}>U</button>
                <label className="px-2 py-1 border rounded cursor-pointer">
                  📎
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={onPickFile} />
                </label>
                <span className="text-xs text-gray-500">Preview shows sanitized/compiled output.</span>
              </div>

              {/* Preview */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={doPreview} disabled={!content || busy} className="px-3 py-2 border rounded">
                    {busy ? 'Please wait…' : 'Preview'}
                  </button>
                  {cover && <span className="text-xs text-gray-500">Cover: <code>{cover}</code></span>}
                </div>
                {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
                {previewHtml && (
                  <div className="rounded border overflow-hidden">
                    <iframe title="preview" className="w-full" style={{ height: 420, border: 0 }} srcDoc={previewHtml} />
                  </div>
                )}

                {/* Cover picker (from extracted media) */}
                {(images.length>0 || videos.some(v=>v.poster)) && (
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-1">Pick cover image</div>
                    <div className="flex flex-wrap gap-3">
                      {images.map((img, i) => (
                        <button key={`img-${i}`} onClick={() => setCoverOverride(img.url || null)}
                          className={`border rounded overflow-hidden ${cover === img.url ? 'ring-2 ring-red-500' : ''}`}>
                          {/* eslint-disable-next-line jsx-a11y/alt-text */}
                          <img src={img.url} className="h-20 w-28 object-cover" />
                        </button>
                      ))}
                      {videos.filter(v => v.poster).map((v, i) => (
                        <button key={`vid-${i}`} onClick={() => setCoverOverride(v.poster!)}
                          className={`border rounded overflow-hidden ${cover === v.poster ? 'ring-2 ring-red-500' : ''}`}>
                          {/* eslint-disable-next-line jsx-a11y/alt-text */}
                          <img src={v.poster!} className="h-20 w-28 object-cover" />
                        </button>
                      ))}
                      {coverOverride && (
                        <button onClick={() => setCoverOverride(null)} className="px-3 py-2 border rounded text-sm">
                          Use suggested cover
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t">
              <div className="text-xs text-gray-500">Auto-detect: <b>{detected}</b>. Hashtags become clickable tags automatically.</div>
              <div className="flex gap-2">
                <button onClick={() => { setOpen(false); resetAll(); }} className="px-3 py-2 border rounded">Cancel</button>
                <button onClick={publish} disabled={!title || !content || busy} className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-60">
                  {busy ? 'Publishing…' : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
