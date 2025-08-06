export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-6">
      <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
        © {new Date().getFullYear()} Patwua
      </div>
    </footer>
  );
}
