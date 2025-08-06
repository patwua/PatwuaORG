export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-xl font-bold">Patwua</div>
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          ☀️
        </button>
      </div>
    </header>
  );
}
