'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDownIcon } from '@/components/icons';
import { avatarUrl } from '@/lib/upload';
import type { Comment } from '@/types/post';

export default function PostComments({
  comments,
  postId,
}: {
  comments: Comment[];
  postId: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [allComments, setAllComments] = useState(comments);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    void postId;

    const comment: Comment = {
      id: Date.now().toString(),
      author: {
        name: 'Current User',
        avatar: '/current-user.jpg',
        verified: false,
      },
      content: newComment,
      timestamp: new Date(),
      replies: [],
    };

    setAllComments((prev) => [...prev, comment]);
    setNewComment('');
    // API call would go here
    // await api.addComment(postId, newComment);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50">
      {allComments.length > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 px-4 text-sm font-medium flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          {isExpanded ? 'Hide' : 'Show'} {allComments.length} comment{allComments.length !== 1 ? 's' : ''}
        </button>
      )}

      {isExpanded && (
        <div className="p-4 space-y-4">
          {allComments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="mt-1 flex-shrink-0">
                <AvatarImage src={avatarUrl(comment.author.avatar || '')} />
                <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="comment-bubble">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {comment.author.name}
                  </p>
                  <p className="text-gray-800 dark:text-gray-200 mt-1">
                    {comment.content}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-2 ml-3">
                  <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500">Like</button>
                  <span className="text-xs text-gray-400">•</span>
                  <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500">Reply</button>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <Avatar className="flex-shrink-0">
            <AvatarImage src={avatarUrl('/current-user.jpg')} />
            <AvatarFallback>Y</AvatarFallback>
          </Avatar>
          <div className="flex-1 relative">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 text-sm pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 font-medium disabled:text-gray-400 text-sm"
            >
              Post
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

