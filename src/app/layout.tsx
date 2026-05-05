import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { PlayerBar } from "@/components/PlayerBar";
import { RightSidebar } from "@/components/RightSidebar";
import { LyricsOverlay } from "@/components/LyricsOverlay";
import { ToastContainer } from "@/components/ToastContainer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MUSE - Music Streaming App",
  description: "Modern music streaming application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning className={`${inter.className} bg-black text-white overflow-hidden h-screen flex flex-col`}>
        
        {/* Main content area — account for PlayerBar + mobile bottom nav */}
        <div className="flex flex-1 overflow-hidden h-[calc(100vh-4.5rem)] md:h-[calc(100vh-6rem)]">
          <Sidebar />
          
          {/* On mobile, add bottom padding for the stacked mobile nav + player bar */}
          <main className="flex-1 overflow-y-auto bg-neutral-950 md:rounded-tl-2xl p-4 md:p-8 custom-scrollbar pb-20 md:pb-8">
            {children}
          </main>
          
          <RightSidebar />
        </div>
        
        <LyricsOverlay />
        
        {/* The Player Bar will be rendered conditionally inside it when a track exists, but is always mounted to hold audio ref */}
        <PlayerBar />
        <ToastContainer />

      </body>
    </html>
  );
}
