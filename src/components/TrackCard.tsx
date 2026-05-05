"use client";

import { useState, useRef, useEffect } from "react";
import { usePlayerStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast";
import { Play, Pause, Heart, MoreHorizontal, ListPlus, Radio, User } from "lucide-react";
import Link from "next/link";
import { Track, FALLBACK_IMAGE } from "@/lib/api";

interface TrackCardProps {
  track: Track;
  contextQueue?: Track[];
  contextType?: "search" | "homepage" | "favorites";
}

export function TrackCard({ track, contextQueue, contextType = "homepage" }: TrackCardProps) {
  const { playTrack, currentTrack, isPlaying, toggleFavorite, favorites, setHasInteracted, appendQueue, queue } = usePlayerStore();
  const { showToast } = useToastStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isCurrentTrack = currentTrack?.id === track.id;
  const validFavorites = favorites.filter((f) => typeof f === 'object' && f !== null);
  const isFav = validFavorites.some((f) => f.id === track.id);
  const isInQueue = queue.some((t) => t.id === track.id);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  const handlePlay = () => {
    setHasInteracted();
    if (isCurrentTrack) {
      usePlayerStore.getState().togglePlay();
    } else {
      playTrack(track, contextQueue, contextType);
    }
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);

    if (isInQueue) {
      showToast("Sudah ada di antrean");
      return;
    }

    appendQueue([track]);
    showToast(`Ditambahkan ke antrean`);
  };

  return (
    <div className="group relative bg-neutral-900/40 hover:bg-neutral-800/60 transition p-3 md:p-4 rounded-xl flex flex-col gap-2 md:gap-3 cursor-pointer overflow-visible border border-transparent hover:border-neutral-700/50">
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
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-cyan-500 text-black rounded-full shadow-xl transform translate-y-4 group-hover:translate-y-0 transition duration-300 hover:scale-110 active:scale-95"
          >
            {isCurrentTrack && isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-1" />
            )}
          </button>
        </div>

        {/* Favorite Button */}
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

      <div className="flex items-start justify-between gap-1">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <h3 className="font-bold text-white text-sm md:text-base truncate group-hover:text-cyan-400 transition">
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
          <p className="text-xs text-neutral-500 truncate mt-0.5">
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

        {/* 3-dot menu button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1.5 rounded-full text-neutral-500 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/10 transition"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 top-8 w-48 bg-neutral-800 rounded-lg shadow-2xl shadow-black/50 border border-neutral-700 py-1.5 z-50 animate-menu-in">
              <button
                onClick={handleAddToQueue}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/10 transition text-left"
              >
                <ListPlus className="w-4 h-4 text-neutral-400" />
                Tambahkan ke Antrean
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(track);
                  setMenuOpen(false);
                  showToast(isFav ? "Dihapus dari favorit" : "Ditambahkan ke favorit");
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/10 transition text-left"
              >
                <Heart className={cn("w-4 h-4", isFav ? "text-cyan-500 fill-current" : "text-neutral-400")} />
                {isFav ? "Hapus dari Favorit" : "Tambahkan ke Favorit"}
              </button>
              {track.artistId && (
                <Link
                  href={`/artist/${track.artistId}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/10 transition text-left"
                >
                  <User className="w-4 h-4 text-neutral-400" />
                  Lihat Artis
                </Link>
              )}
            </div>
          )}
        </div>
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
