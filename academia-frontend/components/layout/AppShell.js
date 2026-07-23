"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Footer from "./Footer";
import NavigationProgressBar from "./NavigationProgressBar";

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <NavigationProgressBar />
      <TopBar onMenuClick={() => setSidebarOpen((prev) => !prev)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">{children}</main>
      <Footer />
    </div>
  );
}