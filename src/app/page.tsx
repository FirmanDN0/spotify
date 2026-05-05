"use client";

import { useEffect, useState } from "react";
import { getTrendingTracks, Track } from "@/lib/api";
import { TrackCard } from "@/components/TrackCard";
import { usePlayerStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [trending, setTrending] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { recentlyPlayed } = usePlayerStore();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const tracks = await getTrendingTracks();
        setTrending(tracks);
      } catch (error) {
        console.error("Failed to fetch trending tracks", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrending();
  }, []);

  return (
    <div className="flex flex-col gap-8 md:gap-10 pb-20">
      {/* Header Area */}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
          Good Evening
        </h1>
        <p className="text-neutral-400 text-sm md:text-base">Discover new music and listen to your favorites.</p>
      </header>

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <section className="flex flex-col gap-4 md:gap-6">
          <h2 className="text-xl md:text-2xl font-bold text-white">Recently Played</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
            {recentlyPlayed.map((track) => (
              <TrackCard
                key={`recent-${track.id}`}
                track={track}
                contextType="homepage"
              />
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      <section className="flex flex-col gap-4 md:gap-6">
        <h2 className="text-xl md:text-2xl font-bold text-white">Trending Now</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
          </div>
        ) : trending.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
            {trending.map((track) => (
              <TrackCard
                key={`trending-${track.id}`}
                track={track}
                contextType="homepage"
              />
            ))}
          </div>
        ) : (
          <p className="text-neutral-500">Could not load trending tracks.</p>
        )}
      </section>
    </div>
  );
}
