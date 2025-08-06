import { User } from './user';

export interface PostType {
  id: string;
  author: User;
  content: string;
  media?: {
    type: 'image' | 'video' | 'link';
    url: string;
  };
  stats: {
    likes: number;
    comments: number;
    bookmarks: number;
  };
  comments: Comment[];
  timestamp: Date;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  timestamp: Date;
  replies?: Comment[];
}
