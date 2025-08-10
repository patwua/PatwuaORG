import type { Post } from '@/types/post';

export default function PostContent({ post }: { post: Post }) {
  return (
    <div className="p-4">
      {post.coverImage && (
        <figure className="mb-4">
          <img src={post.coverImage} alt="" className="w-full h-auto rounded-lg" />
        </figure>
      )}
      {post.bodyHtml ? (
        <div className="prose max-w-none post-html" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
      ) : (
        <div className="prose max-w-none">{post.body}</div>
      )}
    </div>
  );
}
