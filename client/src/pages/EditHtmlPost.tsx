import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type MediaImage = { url?: string; alt?: string; width?: number | null; height?: number | null };
type MediaVideo = { type: 'iframe' | 'video'; url?: string; poster?: string | null };

type Post = {
  _id: string;
  slug: string;
  title: string;
  body?: string;
  bodyHtml?: string;
  sourceRaw?: string; // only returned for author/admin
  tags?: string[];
  coverImage?: string | null;
  format?: 'html' | 'mjml' | 'richtext';
  author?: { _id: string };
};

const draftKey = (id: string) => `editDraft:${id}`;

function parseTags(input: string): string[] {
  return input
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 10);
}

export default function EditHtmlPost() {
  const { user } = useAuth();
  const { slug } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); // HTML or MJML
  const [tags, setTags] = useState('');
  const [coverSuggested, setCoverSuggested] = useState<string | null>(null);
  const [coverOverride, setCoverOverride] = useState<string | null>(null);

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [images, setImages] = useState<MediaImage[]>([]);
  const [videos, setVideos] = useState<MediaVideo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);

  const canEdit = useMemo(() => {
    if (!user || !post) return false;
    const isOwner = post.author && String(post.author._id) === String(user.id);
    const isAdmin = ['system_admin', 'admin'].includes(user.role);
    return isOwner || isAdmin;
  }, [user, post]);

  // Load post by slug
  useEffect(() => {
    let mounted = true;
    (async () => {
      setError(null);
      try {
        const { data } = await api.get(`/posts/slug/${slug}`, { withCredentials: true });
        if (!mounted) return;
        const p: Post = data.post;
        setPost(p);
        setTitle(p.title || '');

        // Prefer original author input; fall back to bodyHtml
        const initialSource = p.sourceRaw || p.bodyHtml || p.body || '';
        setContent(initialSource);

        setTags((p.tags || []).join(', '));
        setCoverOverride(p.coverImage || null);

        // Local draft? Offer restore.
        const dk = draftKey(p._id);
        const cached = localStorage.getItem(dk);
        if (cached) {
          setDraftNotice('Found a local draft for this post. You can restore it below.');
        }
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Failed to load post');
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  // Preview
  const doPreview = async () => {
    if (!content) return;
    setBusy(true); setError(null);
    try {
      const { data } = await api.post('/posts/preview', { content }, { withCredentials: true });
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

  // Save draft locally (does not change live post)
  const saveLocalDraft = () => {
    if (!post) return;
    const payload = {
      title, content, tags, coverOverride,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(draftKey(post._id), JSON.stringify(payload));
    setDraftNotice('Draft saved locally (this does not change the live post).');
  };

  const restoreLocalDraft = () => {
    if (!post) return;
    const raw = localStorage.getItem(draftKey(post._id));
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      setTitle(d.title ?? title);
      setContent(d.content ?? content);
      setTags(d.tags ?? tags);
      setCoverOverride(d.coverOverride ?? coverOverride);
      setDraftNotice('Draft restored. Remember to Publish changes to update the live post.');
    } catch {
      setDraftNotice('Could not restore draft.');
    }
  };

  const discardLocalDraft = () => {
    if (!post) return;
    localStorage.removeItem(draftKey(post._id));
    setDraftNotice('Local draft discarded.');
  };

  // Publish changes
  const publish = async () => {
    if (!post) return;
    setBusy(true); setError(null);
    try {
      const payload: any = {
        title,
        content, // server will detect HTML/MJML & sanitize/compile
        tags: parseTags(tags),
      };
      // If user explicitly chose a cover
      if (coverOverride !== null) payload.coverImage = coverOverride;

      await api.patch(`/posts/${post._id}`, payload, { withCredentials: true });

      // clear local draft after successful publish
      localStorage.removeItem(draftKey(post._id));
      navigate(`/p/${post.slug}`, { replace: true });
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to publish changes');
    } finally {
      setBusy(false);
    }
  };

  const cover = coverOverride || coverSuggested || null;

  if (!post) {
    return (
      <div className="p-4">
        {error ? <div className="text-red-600">{error}</div> : 'Loading post…'}
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="p-4">
        You don’t have permission to edit this post.{" "}
        <Link className="underline" to={`/p/${post.slug}`}>Back to post</Link>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Edit Post</h1>
        <div className="text-sm text-gray-500">Slug stays the same: <code>/p/{post.slug}</code></div>
      </div>

      {draftNotice && <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">{draftNotice}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* Title */}
      <div className="space-y-2">
        <label className="block text-sm">Title</label>
        <input
          value={title}
          onChange={e=>setTitle(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="Title"
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <label className="block text-sm">Content (HTML or MJML)</label>
        <textarea
          value={content}
          onChange={e=>setContent(e.target.value)}
          rows={18}
          className="w-full border rounded px-3 py-2 font-mono"
          placeholder="Paste/edit your HTML or MJML here"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={doPreview}
          disabled={!content || busy}
          className="bg-gray-900 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {busy ? 'Please wait…' : 'Preview'}
        </button>
        <button
          onClick={saveLocalDraft}
          disabled={busy}
          className="bg-gray-200 px-4 py-2 rounded disabled:opacity-60"
        >
          Save draft (local)
        </button>
        <button
          onClick={publish}
          disabled={!title || !content || busy}
          className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {busy ? 'Publishing…' : 'Publish changes'}
        </button>
        <Link to={`/p/${post.slug}`} className="px-3 py-2 border rounded">Cancel</Link>
        <button
          onClick={restoreLocalDraft}
          className="px-3 py-2 border rounded"
        >
          Restore local draft
        </button>
        <button
          onClick={discardLocalDraft}
          className="px-3 py-2 border rounded"
        >
          Discard local draft
        </button>
      </div>

      {/* Cover picker */}
      {(images.length > 0 || videos.length > 0 || cover) && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Cover image</div>
          <div className="flex flex-wrap gap-3">
            {cover && (
              <div className="rounded border px-2 py-1 text-xs text-gray-600">
                Current: <span className="font-medium">{cover}</span>
              </div>
            )}
            {images.map((img, idx) => (
              <button
                key={`img-${idx}`}
                onClick={() => setCoverOverride(img.url || null)}
                className={`border rounded overflow-hidden ${cover === img.url ? 'ring-2 ring-red-500' : ''}`}
                title={img.alt || 'cover option'}
              >
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <img src={img.url} className="h-24 w-36 object-cover" />
              </button>
            ))}
            {videos.filter(v => v.poster).map((v, idx) => (
              <button
                key={`vid-${idx}`}
                onClick={() => setCoverOverride(v.poster!)}
                className={`border rounded overflow-hidden ${cover === v.poster ? 'ring-2 ring-red-500' : ''}`}
                title="video poster"
              >
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <img src={v.poster!} className="h-24 w-36 object-cover" />
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

      {/* Tags */}
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

