import PostHeader from './PostHeader';
import PostActions from './PostActions';
import PostComments from './PostComments';
import PostContent from './PostContent';
import type { Post as PostType } from '@/types/post';

export default function Post({ post }: { post: PostType }) {
  return (
    <article className="post-card mb-6">
      <PostHeader author={post.author} timestamp={post.timestamp} />
      <PostContent post={post as any} />
      <PostActions post={post as any} />
      <PostComments post={post as any} />
    </article>
  );
}
