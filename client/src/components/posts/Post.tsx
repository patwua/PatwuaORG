import PostHeader from './PostHeader';
import PostMedia from './PostMedia';
import PostActions from './PostActions';
import PostComments from './PostComments';
import PostContent from './PostContent';
import type { Post as PostType } from '@/types/post';

export default function Post({ post }: { post: PostType }) {
  return (
    <article className="post-card mb-6">
      <PostHeader author={post.author} timestamp={post.timestamp} />
      <PostContent post={post as any} />
      {post.media && (
        <div className="px-4 pb-4">
          <PostMedia media={post.media} />
        </div>
      )}
      <PostActions
        stats={post.stats}
        postId={post.id}
        isLiked={post.isLiked}
        isBookmarked={post.isBookmarked}
      />
      <PostComments comments={post.comments} postId={post.id} />
    </article>
  );
}
