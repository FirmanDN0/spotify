import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { PlayerBar } from "@/components/PlayerBar";
import { RightSidebar } from "@/components/RightSidebar";
import { LyricsOverlay } from "@/components/LyricsOverlay";

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
        
        <div className="flex flex-1 overflow-hidden h-[calc(100vh-6rem)]"> {/* 6rem is for the PlayerBar (h-24) */}
          <Sidebar />
          
          <main className="flex-1 overflow-y-auto bg-neutral-950 rounded-tl-2xl p-8 custom-scrollbar">
            {children}
          </main>
          
          <RightSidebar />
        </div>
        
        <LyricsOverlay />
        
        {/* The Player Bar will be rendered conditionally inside it when a track exists, but is always mounted to hold audio ref */}
        <PlayerBar />

      </body>
    </html>
  );
}
