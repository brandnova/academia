import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import AppShell from "@/components/layout/AppShell";

export const metadata = {
  title: "Academia",
  description: "Academic Q&A for Nigerian tertiary students",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}