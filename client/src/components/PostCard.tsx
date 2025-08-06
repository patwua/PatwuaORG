export default function PostCard() {
  return (
    <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6 transition-all hover:shadow-md">
      <div className="p-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600"></div>
        <div>
          <h3 className="font-medium">Username</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">2 hours ago</p>
        </div>
      </div>
      
      <div className="p-4">
        <p className="mb-4 text-gray-800 dark:text-gray-200">
          This is a sample post content that would be replaced with real data.
        </p>
        <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
      </div>
      
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex gap-4">
        <button className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <span>👍</span> 24
        </button>
        <button className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <span>💬</span> 5
        </button>
      </div>
    </article>
  );
}
