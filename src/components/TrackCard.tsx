"use client";

import { usePlayerStore } from "@/lib/store";
import { Play, Pause, Heart } from "lucide-react";
import Link from "next/link";
import { Track, FALLBACK_IMAGE } from "@/lib/api";

interface TrackCardProps {
  track: Track;
  contextQueue?: Track[];
  contextType?: "search" | "homepage" | "favorites";
}

export function TrackCard({ track, contextQueue, contextType = "homepage" }: TrackCardProps) {
  const { playTrack, currentTrack, isPlaying, toggleFavorite, favorites, setHasInteracted } = usePlayerStore();

  const isCurrentTrack = currentTrack?.id === track.id;
  const validFavorites = favorites.filter((f) => typeof f === 'object' && f !== null);
  const isFav = validFavorites.some((f) => f.id === track.id);

  const handlePlay = () => {
    setHasInteracted();
    if (isCurrentTrack) {
      usePlayerStore.getState().togglePlay();
    } else {
      playTrack(track, contextQueue, contextType);
    }
  };

  return (
    <div className="group relative bg-neutral-900/40 hover:bg-neutral-800/60 transition p-4 rounded-xl flex flex-col gap-3 cursor-pointer overflow-hidden border border-transparent hover:border-neutral-700/50">
      <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg bg-neutral-800">
        <img
          src={track.cover_image}
          alt={track.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
          }}
        />
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePlay();
            }}
            className="w-12 h-12 flex items-center justify-center bg-cyan-500 text-black rounded-full shadow-xl transform translate-y-4 group-hover:translate-y-0 transition duration-300 hover:scale-110 active:scale-95"
          >
            {isCurrentTrack && isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-1" />
            )}
          </button>
        </div>

        {/* Favorite Button (Visible on hover or if favorited) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(track);
          }}
          className={cn(
            "absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition duration-300",
            isFav 
              ? "bg-cyan-500 text-black opacity-100" 
              : "bg-black/20 text-white opacity-0 group-hover:opacity-100 hover:bg-black/40"
          )}
        >
          <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
        </button>
      </div>

      <div className="flex flex-col gap-1 pr-8">
        <h3 className="font-bold text-white truncate group-hover:text-cyan-400 transition">
          {track.title}
        </h3>
        <p className="text-sm text-neutral-400 truncate">
          {track.artistId ? (
            <Link 
              href={`/artist/${track.artistId}`}
              className="hover:text-cyan-400 hover:underline transition"
              onClick={(e) => e.stopPropagation()}
            >
              {track.artist}
            </Link>
          ) : (
            track.artist
          )}
        </p>
        <p className="text-xs text-neutral-500 truncate mt-1">
          {track.albumId ? (
            <Link 
              href={`/album/${track.albumId}`}
              className="hover:text-white hover:underline transition"
              onClick={(e) => e.stopPropagation()}
            >
              {track.album}
            </Link>
          ) : (
            track.album
          )}
        </p>
      </div>
      
      {/* Current Playing Indicator */}
      {isCurrentTrack && (
        <div className="absolute bottom-4 right-4 flex items-end gap-[2px] h-3">
          <div className={cn("w-[3px] bg-cyan-500 rounded-full", isPlaying ? "animate-music-bar-1" : "h-1")} />
          <div className={cn("w-[3px] bg-cyan-500 rounded-full", isPlaying ? "animate-music-bar-2" : "h-2")} />
          <div className={cn("w-[3px] bg-cyan-500 rounded-full", isPlaying ? "animate-music-bar-3" : "h-1")} />
        </div>
      )}
    </div>
  );
}

// Helper for cn (usually in @/lib/utils)
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
