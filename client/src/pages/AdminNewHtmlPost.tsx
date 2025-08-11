import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type MediaImage = { url?: string; alt?: string; width?: number | null; height?: number | null };
type MediaVideo = { type: 'iframe' | 'video'; url?: string; poster?: string | null };

export default function AdminNewHtmlPost() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); // HTML or MJML
  const [tags, setTags] = useState('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [images, setImages] = useState<MediaImage[]>([]);
  const [videos, setVideos] = useState<MediaVideo[]>([]);
  const [coverSuggested, setCoverSuggested] = useState<string | null>(null);
  const [coverOverride, setCoverOverride] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [personas, setPersonas] = useState<any[]>([]);
  const canPost = !!user && (['system_admin','admin','verified_publisher','verified_influencer','advertiser'].includes(user.role));

  if (!user) return <div className="p-4">Please sign in.</div>;
  if (!canPost) return <div className="p-4">Forbidden</div>;

  useEffect(() => {
    api.get('/personas?owner=me').then(({ data }) => setPersonas(data.personas || data || []));
  }, []);

  const doPreview = async () => {
    setBusy(true); setError(null);
    try {
      const { data } = await api.post('/posts/preview', { content });
      setPreviewHtml(data.html);
      setImages(data.media?.images || []);
      setVideos(data.media?.videos || []);
      setCoverSuggested(data.coverSuggested || null);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Preview failed');
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    setBusy(true);
    try {
      const payload: any = {
        title,
        content,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (coverOverride) payload.coverImage = coverOverride;
      if (personaId) payload.personaId = personaId;

      const { data } = await api.post('/posts', payload);
      window.location.href = `/p/${data.post.slug}`; // adapt if your route differs
    } finally {
      setBusy(false);
    }
  };

  const cover = coverOverride || coverSuggested || null;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">New Post (HTML / MJML — Auto)</h1>

      <div className="space-y-2">
        <label className="block text-sm">Title</label>
        <input
          value={title}
          onChange={e=>setTitle(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="Enter a title"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm">Posting as</label>
        <select
          value={personaId ?? ''}
          onChange={e => setPersonaId(e.target.value || null)}
          className="border rounded px-2 py-1"
        >
          <option value="">(use default)</option>
          {personas.map(p => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm">Content (HTML or MJML)</label>
        <textarea
          value={content}
          onChange={e=>setContent(e.target.value)}
          rows={16}
          className="w-full border rounded px-3 py-2 font-mono"
          placeholder="Paste your HTML or MJML here"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={doPreview}
          disabled={!content || busy}
          className="bg-gray-900 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {busy ? 'Please wait…' : 'Preview'}
        </button>
        <button
          onClick={publish}
          disabled={!title || !content || busy}
          className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {busy ? 'Publishing…' : 'Publish'}
        </button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* Cover picker */}
      {(images.length > 0 || videos.length > 0) && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Cover image</div>
          <div className="flex flex-wrap gap-3">
            {images.map((img, idx) => (
              <button
                key={`img-${idx}`}
                onClick={() => setCoverOverride(img.url || null)}
                className={`border rounded overflow-hidden ${cover === img.url ? 'ring-2 ring-red-500' : ''}`}
                title={img.alt || 'cover option'}
              >
                <img src={img.url} alt={img.alt || ''} className="h-24 w-36 object-cover" />
              </button>
            ))}
            {/* Video posters as fallback options (if any) */}
            {videos.filter(v => v.poster).map((v, idx) => (
              <button
                key={`vid-${idx}`}
                onClick={() => setCoverOverride(v.poster!)}
                className={`border rounded overflow-hidden ${cover === v.poster ? 'ring-2 ring-red-500' : ''}`}
                title="video poster"
              >
                <img src={v.poster!} alt="" className="h-24 w-36 object-cover" />
              </button>
            ))}
            {/* Clear override */}
            {coverOverride && (
              <button
                onClick={() => setCoverOverride(null)}
                className="px-3 py-2 border rounded text-sm"
              >
                Use suggested cover
              </button>
            )}
          </div>
        </div>
      )}

      {/* Live preview */}
      {previewHtml && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Preview</div>
          <div className="rounded-lg border overflow-hidden">
            <iframe
              title="Post Preview"
              className="w-full"
              style={{ height: 600, border: '0' }}
              sandbox="allow-same-origin allow-popups allow-forms allow-scripts"
              srcDoc={previewHtml}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm">Tags (comma-separated)</label>
        <input
          value={tags}
          onChange={e=>setTags(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="e.g. welcome, platform, patwua"
        />
      </div>
    </div>
  );
}
