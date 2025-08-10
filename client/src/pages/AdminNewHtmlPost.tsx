import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function AdminNewHtmlPost() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState<'html'|'mjml'>('html');
  const [payload, setPayload] = useState(''); // html or mjml
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === 'system_admin' || user?.role === 'admin' || user?.role === 'verified_publisher' || user?.role === 'verified_influencer' || user?.role === 'advertiser';

  if (!user) return <div className="p-4">Please sign in.</div>;
  if (!isAdmin) return <div className="p-4">Forbidden</div>;

  const submit = async () => {
    setSaving(true);
    try {
      const body: any = { title, format, tags: tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (format === 'html') body.html = payload;
      else body.mjml = payload;
      const { data } = await api.post('/posts', body, { withCredentials: true });
      window.location.href = `/p/${data.post.slug}`; // adapt to your router
    } finally { setSaving(false); }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">New {format.toUpperCase()} Post</h1>
      <div className="space-y-2">
        <label className="block text-sm">Title</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border rounded px-3 py-2" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm">Format</label>
        <select value={format} onChange={e=>setFormat(e.target.value as any)} className="border rounded px-2 py-1">
          <option value="html">HTML</option>
          <option value="mjml">MJML</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="block text-sm">{format.toUpperCase()} Content</label>
        <textarea value={payload} onChange={e=>setPayload(e.target.value)} rows={18} className="w-full border rounded px-3 py-2 font-mono" placeholder={`Paste ${format.toUpperCase()} here`} />
      </div>
      <div className="space-y-2">
        <label className="block text-sm">Tags (comma-separated)</label>
        <input value={tags} onChange={e=>setTags(e.target.value)} className="w-full border rounded px-3 py-2" />
      </div>
      <button onClick={submit} disabled={saving || !title || !payload} className="bg-black text-white px-4 py-2 rounded disabled:opacity-60">
        {saving ? 'Publishing…' : 'Publish'}
      </button>
    </div>
  );
}
