import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostMedia from './PostMedia';
import PostActions from './PostActions';
import PostComments from './PostComments';
import type { PostType } from '@/types/post';

export default function Post({ post }: { post: PostType }) {
  return (
    <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6 transition-all hover:shadow-md">
      <PostHeader author={post.author} timestamp={post.timestamp} />
      <PostContent content={post.content} />
      {post.media && <PostMedia media={post.media} />}
      <PostActions stats={post.stats} />
      <PostComments comments={post.comments} />
    </article>
  );
}
