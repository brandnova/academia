export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-border)] px-4 py-3 mt-8">
      <div className="max-w-5xl mx-auto text-sm text-muted text-center">
        <p>Academia Atlas</p>
        <p className="text-xs mt-1">© {year} Academia Atlas, built by Brand Nova and contributors.</p>
      </div>
    </footer>
  );
}