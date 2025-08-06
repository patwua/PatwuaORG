import Post from '@/components/posts/Post';
import { mockPosts } from '@/lib/mock';

export default function PostFeed() {
  return (
    <div className="space-y-6">
      {mockPosts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  );
}
