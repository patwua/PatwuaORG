import { PostType } from '@/types/post';

export const mockPosts: PostType[] = [
  {
    id: '1',
    author: {
      name: 'TravelEnthusiast',
      avatar: '/avatars/travel.jpg',
      verified: true,
    },
    content:
      'Just visited this amazing hidden beach in Thailand! The water was crystal clear and we had the whole place to ourselves. #travel #adventure',
    media: {
      type: 'image',
      url: '/posts/beach.jpg',
    },
    stats: {
      likes: 1243,
      comments: 87,
      bookmarks: 42,
    },
    isLiked: true,
    isBookmarked: false,
    comments: [
      {
        id: 'c1',
        author: {
          name: 'Wanderer123',
          avatar: '/avatars/wanderer.jpg',
          verified: false,
        },
        content: 'This looks incredible! Could you share the location?',
        timestamp: new Date(Date.now() - 3600000 * 2),
      },
    ],
    timestamp: new Date(Date.now() - 3600000 * 5),
  },
];
