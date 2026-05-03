"use client";

import { usePlayerStore } from "@/lib/store";
import { Track, FALLBACK_IMAGE } from "@/lib/api";
import { Heart, Play, Pause, Clock } from "lucide-react";

export default function FavoritesPage() {
  const { favorites, playTrack, currentTrack, isPlaying, setHasInteracted, toggleFavorite } = usePlayerStore();
  
  // Filter out any legacy string IDs from localStorage
  const favoriteTracks = favorites.filter((f): f is Track => typeof f === 'object' && f !== null);

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayAll = () => {
    if (favoriteTracks.length > 0) {
      setHasInteracted();
      playTrack(favoriteTracks[0], favoriteTracks, "favorites");
    }
  };

  return (
    <div className="flex flex-col pb-20 relative -mt-8 -mx-8 md:-mt-12 md:-mx-12 min-h-screen bg-neutral-900">
      {/* Background Gradient */}
      <div 
        className="absolute top-0 left-0 right-0 h-[500px] pointer-events-none opacity-40 transition-colors duration-1000 z-0"
        style={{
          background: `linear-gradient(to bottom, #5038a0 0%, transparent 100%)`
        }}
      />

      {/* Header Section */}
      <div className="relative flex flex-col md:flex-row items-end gap-8 mb-10 pt-16 px-8 md:pt-24 md:px-12 z-10">
        <div className="w-52 h-52 md:w-64 md:h-64 flex-shrink-0 shadow-2xl rounded-xl overflow-hidden relative bg-gradient-to-br from-indigo-500 to-purple-800 flex items-center justify-center">
          <Heart className="w-24 h-24 text-white drop-shadow-xl" />
        </div>

        <div className="flex flex-col gap-4 text-white">
          <span className="text-sm font-bold uppercase tracking-widest hidden md:block">Playlist</span>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter">
            Liked Songs
          </h1>
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-300 mt-2">
            <span className="font-bold text-white">Muse</span>
            <span>•</span>
            <span>{favoriteTracks.length} {favoriteTracks.length === 1 ? "song" : "songs"}</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-8 md:px-12 flex flex-col gap-8">
        {/* Play Button Row */}
        {favoriteTracks.length > 0 && (
          <div className="flex items-center gap-6">
            <button 
              onClick={handlePlayAll}
              className="w-16 h-16 bg-cyan-500 text-black rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition"
            >
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
          </div>
        )}

        {/* Tracklist Table */}
        {favoriteTracks.length > 0 ? (
          <div className="flex flex-col">
            <div className="grid grid-cols-[16px_1fr_120px] gap-4 px-4 py-2 border-b border-neutral-800 text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
              <div className="text-center">#</div>
              <div>Title</div>
              <div className="text-right flex items-center justify-end">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            {favoriteTracks.map((track, index) => {
              const isCurrent = currentTrack?.id === track.id;
              
              return (
                <div 
                  key={track.id}
                  onClick={() => {
                    setHasInteracted();
                    playTrack(track, favoriteTracks, "favorites");
                  }}
                  className={`grid grid-cols-[16px_1fr_120px] gap-4 px-4 py-3 rounded-lg transition group cursor-pointer ${
                    isCurrent ? "bg-neutral-800/60" : "hover:bg-neutral-800/30"
                  }`}
                >
                  <div className="flex items-center justify-center text-sm font-medium text-neutral-500 group-hover:hidden">
                    {isCurrent && isPlaying ? (
                      <div className="flex items-end gap-[2px] h-3">
                        <div className="w-[2px] h-3 bg-cyan-500 animate-music-bar-1" />
                        <div className="w-[2px] h-3 bg-cyan-500 animate-music-bar-2" />
                        <div className="w-[2px] h-3 bg-cyan-500 animate-music-bar-3" />
                      </div>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="hidden group-hover:flex items-center justify-center">
                    {isCurrent && isPlaying ? (
                      <Pause className="w-4 h-4 text-white fill-current" />
                    ) : (
                      <Play className="w-4 h-4 text-white fill-current" />
                    )}
                  </div>

                  <div className="flex items-center gap-4 min-w-0">
                    <img 
                      src={track.cover_image} 
                      alt="" 
                      className="w-10 h-10 rounded object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                      }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className={`font-bold truncate ${isCurrent ? "text-cyan-400" : "text-white"}`}>
                        {track.title}
                      </span>
                      <span className="text-xs text-neutral-400 truncate">
                        {track.artist}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-6 text-sm font-medium text-neutral-500">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(track);
                      }}
                      className="hover:text-white transition text-cyan-500"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                    <span className="w-10 text-right">{formatDuration(track.duration)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500 text-center">
            <Heart className="w-16 h-16 mb-4 opacity-20" />
            <h2 className="text-xl font-bold text-white mb-2">Songs you like will appear here</h2>
            <p>Save songs by tapping the heart icon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
