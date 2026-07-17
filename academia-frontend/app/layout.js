import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import AppShell from "@/components/layout/AppShell";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Academia", template: "%s | Academia" },
  description: "Academic Q&A repository for Nigerian tertiary students, organized by school and searchable, so the same question never needs asking twice.",
  openGraph: {
    title: "Academia",
    description: "Academic Q&A repository for Nigerian tertiary students.",
    type: "website",
  },
  twitter: { card: "summary" },
};

function LoadingBar() {
  return (
    <div id="loading-bar" className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-accent/30 pointer-events-none" />
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={jakarta.variable}>
      <body><LoadingBar />
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}