"use client";

import { useEffect, useState, useRef } from "react";
import { usePlayerStore } from "@/lib/store";
import { fetchLyrics } from "@/lib/api";
import { Loader2, Mic2 } from "lucide-react";
import { useImageColor } from "@/hooks/useImageColor";
import { cn } from "@/lib/utils";

interface LyricLine {
  time: number;
  text: string;
}

export function LyricsOverlay() {
  const { currentTrack, isLyricsVisible, progress } = usePlayerStore();
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Use dynamic color based on album cover
  const bgColor = useImageColor(currentTrack?.cover_image || "");

  useEffect(() => {
    if (!isLyricsVisible || !currentTrack) return;

    let isMounted = true;
    
    const loadLyrics = async () => {
      setIsLoading(true);
      setError(null);
      setLyrics([]);

      try {
        const data = await fetchLyrics(currentTrack.title, currentTrack.artist);
        
        if (!isMounted) return;

        if (data?.syncedLyrics) {
          const parsed = parseSyncedLyrics(data.syncedLyrics);
          setLyrics(parsed);
        } else if (data?.plainLyrics) {
           // Fallback to plain lyrics with dummy times so they just show up
           const lines = data.plainLyrics.split('\n').map(line => ({ time: -1, text: line }));
           setLyrics(lines);
        } else {
          setError("Looks like we don't have lyrics for this song.");
        }
      } catch (err) {
        if (isMounted) setError("Failed to load lyrics.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadLyrics();

    return () => {
      isMounted = false;
    };
  }, [currentTrack?.id, isLyricsVisible]);

  // Auto-scroll logic
  useEffect(() => {
    if (activeLineRef.current && isLyricsVisible) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [progress, isLyricsVisible]);

  // Determine the active line index
  let activeIndex = -1;
  if (lyrics.length > 0 && lyrics[0].time !== -1) {
    for (let i = 0; i < lyrics.length; i++) {
      if (progress >= lyrics[i].time) {
        activeIndex = i;
      } else {
        break; // Stop when we find a time in the future
      }
    }
  }

  return (
    <div 
      className={cn(
        "fixed inset-0 z-40 transition-transform duration-500 ease-in-out flex flex-col",
        "bottom-[4.5rem] md:bottom-24",
        isLyricsVisible ? "translate-y-0" : "translate-y-full"
      )}
      style={{
        backgroundColor: bgColor || 'rgb(38, 38, 38)'
      }}
    >
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      
      <div className="relative z-10 flex-1 overflow-y-auto scrollbar-hide px-4 sm:px-8 md:px-32 py-12 md:py-20" ref={containerRef}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="w-12 h-12 text-white animate-spin opacity-50" />
          </div>
        ) : error ? (
          <div className="flex flex-col h-full items-center justify-center text-center text-white/50">
            <Mic2 className="w-16 h-16 mb-4 opacity-30" />
            <h2 className="text-2xl font-bold">{error}</h2>
          </div>
        ) : lyrics.length > 0 ? (
          <div className="flex flex-col gap-6 py-[50vh]">
            {lyrics.map((line, index) => {
              const isActive = index === activeIndex;
              const isPassed = index < activeIndex;
              const isUnsynced = line.time === -1;
              
              return (
                <div
                  key={index}
                  ref={isActive ? activeLineRef : null}
                  className={cn(
                    "text-2xl sm:text-3xl md:text-5xl font-bold transition-all duration-300",
                    isUnsynced ? "text-white/80 text-lg sm:text-xl md:text-3xl" :
                    isActive ? "text-white scale-105 origin-left drop-shadow-xl" :
                    isPassed ? "text-white/40 cursor-pointer hover:text-white/80" : "text-white/50 cursor-pointer hover:text-white/80"
                  )}
                  onClick={() => {
                    // Click to seek to lyric (if synced)
                    if (!isUnsynced) {
                      const audio = document.querySelector('audio');
                      if (audio) audio.currentTime = line.time;
                    }
                  }}
                >
                  {line.text || "♪"}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function parseSyncedLyrics(lrc: string): LyricLine[] {
  const lines = lrc.split('\n');
  const result: LyricLine[] = [];
  
  // Regex to match [mm:ss.xx]
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
  
  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3], 10);
      
      const timeInSeconds = minutes * 60 + seconds + (milliseconds / (match[3].length === 3 ? 1000 : 100));
      const text = line.replace(timeRegex, '').trim();
      
      result.push({ time: timeInSeconds, text });
    }
  }
  
  return result.sort((a, b) => a.time - b.time);
}
