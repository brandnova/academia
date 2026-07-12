export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-border)] px-4 py-3 mt-8">
      <div className="max-w-5xl mx-auto text-sm text-gray-500 dark:text-gray-400 text-center">
        <p>Academia</p>
        <p className="text-xs mt-1">© {year} Academia, built by Brand Nova.</p>
      </div>
    </footer>
  );
}