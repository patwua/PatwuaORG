'use client';

import { useEffect, useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon, ChatBubbleIcon } from '@radix-ui/react-icons';
import { useNavigate } from 'react-router-dom';
import { votePost, getVotes } from '@/lib/api';
import type { Post } from '@/types/post';

export default function PostActions({ post }: { post: Post }) {
  const [score, setScore] = useState(post.stats?.votes ?? post.score ?? 0);
  const [myVote, setMyVote] = useState(post.stats?.myVote ?? 0);
  const navigate = useNavigate();

  useEffect(() => {
    const id = (post as any)._id || post.id;
    if (!id) return;
    getVotes(id).then(({ data }) => {
      setScore(data.score);
      setMyVote(data.myVote);
    }).catch(() => {});
  }, [post]);

  async function handleVote(next: -1 | 0 | 1) {
    const prev = myVote;
    const optimistic = score - prev + next;
    setMyVote(next);
    setScore(optimistic);
    try {
      const id = (post as any)._id || post.id;
      const { data } = await votePost(id, next);
      setScore(data.score);
      setMyVote(data.myVote);
    } catch {
      setMyVote(prev);
      setScore(score);
    }
  }

  return (
    <div className="px-4 py-2 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleVote(myVote === 1 ? 0 : 1)}
          className={`post-action-btn ${myVote === 1 ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <ArrowUpIcon className="w-5 h-5" />
        </button>
        <span className="text-sm">{score}</span>
        <button
          onClick={() => handleVote(myVote === -1 ? 0 : -1)}
          className={`post-action-btn ${myVote === -1 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <ArrowDownIcon className="w-5 h-5" />
        </button>
      </div>
      <button
        onClick={() => navigate(`/p/${post.slug}#comments`)}
        className="post-action-btn text-gray-500 dark:text-gray-400"
      >
        <ChatBubbleIcon className="w-5 h-5" />
        <span className="ml-1 text-sm">{post.stats?.comments ?? 0}</span>
      </button>
    </div>
  );
}
