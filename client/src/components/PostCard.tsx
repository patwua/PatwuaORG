export default function PostCard() {
  return (
    <div className="card rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600"></div>
        <div>
          <h3 className="font-medium">Username</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">2 hours ago</p>
        </div>
      </div>
      
      <p className="mb-4">This is a sample post content that would be replaced with real data.</p>
      
      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
      
      <div className="flex gap-4 text-gray-500 dark:text-gray-400">
        <button className="hover:text-blue-500">Like</button>
        <button className="hover:text-blue-500">Comment</button>
      </div>
    </div>
  );
}
