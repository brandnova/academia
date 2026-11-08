import MyReportsClient from "@/components/reports/MyReportsClient";

// A server wrapper so the page can export metadata. The list itself needs the
// signed-in user, so it lives in a client component. This is a private page,
// so it is marked noindex here and disallowed in app/robots.js.
export const metadata = {
  title: "My reports",
  robots: { index: false, follow: false },
};

export default function MyReportsPage() {
  return <MyReportsClient />;
}