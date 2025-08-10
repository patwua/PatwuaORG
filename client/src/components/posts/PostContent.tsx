import type { Post } from '@/types/post';

export default function PostContent({ post }: { post: Post }) {
  if (post?.bodyHtml) {
    return (
      <div className="p-4">
        <div
          className="prose max-w-none post-html"
          // bodyHtml is already sanitized server-side
          dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
        />
      </div>
    );
  }
  return (
    <div className="p-4">
      <p className="whitespace-pre-line text-gray-800 dark:text-gray-200">
        {post.body}
      </p>
    </div>
  );
}
