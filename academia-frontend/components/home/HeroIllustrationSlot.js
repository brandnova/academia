import { Image as ImageIcon } from "lucide-react";

export default function HeroIllustrationSlot() {
  return (
    <div className="hidden md:flex items-center justify-center w-36 h-36 shrink-0 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-300 dark:text-gray-600">
      <ImageIcon className="w-10 h-10" />
    </div>
  );
}