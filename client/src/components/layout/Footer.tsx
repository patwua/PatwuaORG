export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-6 mt-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-6 mb-4">
          {['About', 'Contact', 'Terms', 'Privacy'].map((item) => (
            <a 
              key={item} 
              href="#" 
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {item}
            </a>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500 dark:text-gray-500">
          © {new Date().getFullYear()} Patwua. All voices welcome.
        </p>
      </div>
    </footer>
  );
}
