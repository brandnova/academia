import ThemeToggle from "./ThemeToggle";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 mt-8">
      <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>Academia</span>
        <ThemeToggle />
      </div>
    </footer>
  );
}