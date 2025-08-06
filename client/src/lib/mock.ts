import { PostType } from '@/types/post';

export const mockPosts: PostType[] = [
  {
    id: '1',
    author: {
      name: 'Jane Doe',
      avatar: '/placeholder-avatar.jpg',
      verified: true,
    },
    content:
      'This is a sample post with some example content that users might share on the platform.',
    media: {
      type: 'image',
      url: '/placeholder-post.jpg',
    },
    stats: {
      likes: 42,
      comments: 7,
      bookmarks: 3,
    },
    isLiked: false,
    isBookmarked: false,
    comments: [],
    timestamp: new Date(),
  },
];
