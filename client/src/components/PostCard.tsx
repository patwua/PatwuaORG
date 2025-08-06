function HeartIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9l4 4v-4h1a2 2 0 0 0 2-2V6z" />
    </svg>
  )
}

export default function PostCard() {
  return (
    <article className="bg-card rounded-lg shadow border border-border overflow-hidden mb-6">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-border">
        <img src="/placeholder-avatar.jpg" className="w-10 h-10 rounded-full" alt="User" />
        <div>
          <h3 className="font-medium">Username</h3>
          <p className="text-sm text-text-light">2 hours ago</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="mb-4">This is a sample post content that would be replaced with real data.</p>
        <img
          src="/placeholder-post.jpg"
          className="w-full rounded mb-4"
          alt="Post"
        />
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-border flex gap-4">
        <button className="flex items-center gap-1 text-text-light hover:text-primary">
          <HeartIcon /> 24
        </button>
        <button className="flex items-center gap-1 text-text-light hover:text-primary">
          <CommentIcon /> 5
        </button>
      </div>
    </article>
  )
}
