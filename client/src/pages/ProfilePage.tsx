import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PostCard from '@/components/PostCard';
import { getByHandle, getCounts, getCommentsByHandle, getMediaByHandle } from '@/lib/users';
import { getPosts } from '@/lib/api';
import { avatarUrl } from '@/lib/upload';
import { isCloudinaryUrl, withTransform, buildSrcSet, sizesUniversal } from '@/lib/images';
import EditProfileModal from '@/components/EditProfileModal';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { handle = '' } = useParams();
  const { user: auth } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [counts, setCounts] = useState<{posts:number;comments:number;upvotes:number}>({posts:0,comments:0,upvotes:0});
  const [tab, setTab] = useState<'posts'|'comments'|'media'|'about'>('posts');
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await getByHandle(handle);
        if (!mounted) return;
        setUser(u.user);
        const c = await getCounts(handle);
        setCounts(c);
      } catch (e:any) {
        setError(e?.message || 'Failed to load');
      }
    })();
    return () => { mounted = false; };
  }, [handle]);

  useEffect(() => {
    if (user) {
      document.title = `${user.displayName || '@'+user.handle} (@${user.handle}) — Patwua`;
      const meta = document.querySelector('meta[name="description"]') || (() => { const m=document.createElement('meta'); m.name='description'; document.head.appendChild(m); return m; })();
      if (user.bio) (meta as HTMLMetaElement).content = user.bio;
    }
  }, [user]);

  useEffect(() => {
    if (tab === 'posts') {
      getPosts({ authorHandle: handle }).then(setPosts);
    } else if (tab === 'comments') {
      getCommentsByHandle(handle).then(r => setComments(r.items));
    } else if (tab === 'media') {
      getMediaByHandle(handle).then(r => setMedia(r.items));
    }
  }, [tab, handle]);

  if (error) return <div className="p-4">User not found.</div>;
  if (!user) return <div className="p-4">Loading…</div>;

  const isOwner = auth?.handle === user.handle;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <header className="flex gap-4 items-center">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-neutral-200">
          {user.avatar && <img src={avatarUrl(user.avatar)} alt={`${user.displayName || user.handle} avatar`} className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{user.displayName || '@'+user.handle}</h1>
          <p className="text-neutral-500">@{user.handle} · Joined {new Date(user.createdAt).toLocaleDateString()}</p>
          <div className="flex gap-4 text-sm mt-2">
            <span>{counts.posts} posts</span>
            <span>{counts.comments} comments</span>
            <span>{counts.upvotes} upvotes</span>
          </div>
        </div>
        {isOwner && (
          <button className="px-3 py-1 border rounded" onClick={() => setShowEdit(true)}>Edit Profile</button>
        )}
      </header>

      <nav className="border-b" role="tablist" aria-label="Profile sections">
        {['posts','comments','media','about'].map(t => (
          <button key={t} role="tab" aria-selected={tab===t} className={`px-4 py-2 -mb-px border-b-2 ${tab===t?'border-orange-600':'border-transparent'}`} onClick={() => setTab(t as any)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
        ))}
      </nav>

      {tab === 'posts' && (
        <div className="space-y-4" role="tabpanel">
          {posts.map(p => <PostCard key={p.id} post={p} />)}
        </div>
      )}

      {tab === 'comments' && (
        <div className="space-y-4" role="tabpanel">
          {comments.map(c => (
            <div key={c._id} className="card p-4">
              <p className="text-sm mb-2">{c.body}</p>
              <a href={`/p/${c.post.slug}`} className="text-sm text-orange-600 hover:underline">{c.post.title}</a>
            </div>
          ))}
        </div>
      )}

      {tab === 'media' && (
        <div className="grid grid-cols-3 gap-2" role="tabpanel">
          {media.map((m,i) => (
            <a key={i} href={`/p/${m.post.slug}`} className="block aspect-square overflow-hidden">
              {m.type === 'image' ? (
                <img
                  src={isCloudinaryUrl(m.url) ? withTransform(m.url, { w: 300 }) : m.url}
                  srcSet={isCloudinaryUrl(m.url) ? buildSrcSet(m.url,[300,600]) : undefined}
                  sizes={isCloudinaryUrl(m.url) ? sizesUniversal() : undefined}
                  alt="media"
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
              ) : (
                <video src={m.url} className="w-full h-full object-cover" aria-label="video clip" />
              )}
            </a>
          ))}
        </div>
      )}

      {tab === 'about' && (
        <div className="card p-4 space-y-2" role="tabpanel">
          {user.bio && <p>{user.bio}</p>}
          {user.location && <p className="text-sm text-neutral-500">{user.location}</p>}
          {user.links?.length > 0 && (
            <ul className="list-disc pl-4">
              {user.links.map((l:any,i:number) => (
                <li key={i}><a href={l.url} className="text-orange-600 hover:underline">{l.label}</a></li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showEdit && <EditProfileModal onClose={() => setShowEdit(false)} />}
    </div>
  );
}
