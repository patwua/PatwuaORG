'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
        avatar: '/current-user-avatar.jpg',
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
    <div className="border-t border-gray-200 dark:border-gray-700">
      {allComments.length > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2 px-4 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {isExpanded ? 'Hide comments' : `Show ${allComments.length} comments`}
        </button>
      )}

      {isExpanded && (
        <div className="p-4 space-y-4">
          {allComments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar>
                <AvatarImage src={comment.author.avatar} />
                <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                  <p className="font-medium">{comment.author.name}</p>
                  <p className="text-gray-800 dark:text-gray-200">{comment.content}</p>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(comment.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="text-blue-500 font-medium disabled:text-gray-400"
          >
            Post
          </button>
        </div>
      </form>
    </div>
  );
}

