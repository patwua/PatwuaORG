import type { PostType } from '@/types/post';

export default function PostComments({ comments }: { comments: PostType['comments'] }) {
  if (!comments.length) return null;

  return (
    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
      {comments.map((comment) => (
        <div key={comment.id} className="mb-2 last:mb-0">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">{comment.author.name}:</span> {comment.content}
          </p>
        </div>
      ))}
    </div>
  );
}
