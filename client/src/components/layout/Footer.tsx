export default function Footer() {
  return (
    <footer className="bg-card border-t py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-6 mb-4">
          {['About', 'Contact', 'Terms', 'Privacy'].map((item) => (
            <a key={item} href="#" className="text-sm text-text-light hover:text-primary">
              {item}
            </a>
          ))}
        </div>
        <p className="text-center text-sm text-text-light">
          © {new Date().getFullYear()} Patwua. All voices welcome.
        </p>
      </div>
    </footer>
  )
}
