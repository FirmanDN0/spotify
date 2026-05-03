"use client";

import { useEffect, useState } from "react";
import { usePlayerStore } from "@/lib/store";
import { Heart, CheckCircle2, X } from "lucide-react";
import { fetchArtist, Artist, FALLBACK_IMAGE } from "@/lib/api";
import { cn } from "@/lib/utils";

export function NowPlayingPanel() {
  const { currentTrack, favorites, toggleFavorite, queue, currentIndex, setRightPanelMode } = usePlayerStore();
  const [artistDetails, setArtistDetails] = useState<Artist | null>(null);

  useEffect(() => {
    if (!currentTrack) return;

    const loadArtistDetails = async () => {
      // Try to fetch artist details if we have an artistId
      if (currentTrack.artistId) {
        const details = await fetchArtist(currentTrack.artistId);
        if (details) setArtistDetails(details);
      }
    };

    loadArtistDetails();
  }, [currentTrack?.id]);

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500">
        <p>No track currently playing</p>
      </div>
    );
  }

  const isFavorite = favorites.some((f) => f.id === currentTrack.id);

  // Use artist thumbnail or fallback to track cover if it's the only thing available
  const artistImage = artistDetails?.thumbnails?.[0]?.url || currentTrack.cover_image;

  return (
    <div className="flex flex-col h-full bg-[#121212] rounded-lg overflow-hidden p-4">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-white font-bold">Now Playing</h2>
        <button 
          onClick={() => setRightPanelMode("closed")}
          className="text-neutral-400 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-20">

      {/* Large Cover Art */}
      <div className="w-full aspect-square rounded-xl overflow-hidden mb-4 shadow-lg shadow-black/40 group relative">
        <img
          src={currentTrack.cover_image}
          alt={currentTrack.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
          }}
        />
      </div>

      {/* Track Info & Like Button */}
      <div className="flex items-center justify-between px-2 mb-8">
        <div className="flex flex-col overflow-hidden">
          <h3 className="text-white font-bold text-2xl truncate">{currentTrack.title}</h3>
          <p className="text-neutral-400 text-base truncate">{currentTrack.artist}</p>
        </div>
        <button
          onClick={() => toggleFavorite(currentTrack)}
          className={cn("p-2 transition-colors", isFavorite ? "text-green-500" : "text-neutral-400 hover:text-white")}
        >
          {isFavorite ? <CheckCircle2 className="w-6 h-6 fill-current text-black" /> : <Heart className="w-6 h-6" />}
        </button>
      </div>

      {/* About Artist Card */}
      <div className="mt-2 bg-neutral-900 rounded-xl overflow-hidden shadow-md">
        <div className="relative h-64 w-full overflow-hidden group cursor-pointer">
          <img
            src={artistImage || FALLBACK_IMAGE}
            alt={currentTrack.artist}
            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />
          <div className="absolute top-4 left-4 font-bold text-white drop-shadow-md z-10">
            Tentang artis
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent pointer-events-none" />
        </div>

        <div className="p-4 pt-2 flex flex-col gap-3">
          <h4 className="text-white font-bold text-xl hover:underline cursor-pointer">{currentTrack.artist}</h4>

          <div className="flex items-center justify-between">
            <span className="text-neutral-400 text-sm">Artist Profile</span>
          </div>

          {artistDetails?.description ? (
            <p className="text-neutral-400 text-sm line-clamp-4 mt-2">
              {artistDetails.description}
            </p>
          ) : (
            <p className="text-neutral-400 text-sm mt-2">
              Learn more about {currentTrack.artist} and discover their top tracks and latest releases.
            </p>
          )}
        </div>
      </div>

      {/* Credits Section */}
      <div className="mt-6 bg-neutral-900 rounded-xl p-4 flex flex-col gap-4 shadow-md">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-bold">Kredit</h4>
          <button className="text-neutral-400 text-xs font-bold hover:text-white transition-colors">Tampilkan semua</button>
        </div>

        {currentTrack.artist.split(", ").map((artistName, idx) => (
          <div key={idx} className="flex items-center justify-between group">
            <div className="flex flex-col">
              <span className="text-white font-medium hover:underline cursor-pointer">{artistName}</span>
              <span className="text-neutral-400 text-sm">{idx === 0 ? "Artis Utama" : "Artis Bintang Tamu"}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Next in Queue */}
      {queue.length > currentIndex + 1 && (
        <div className="mt-6 bg-neutral-900 rounded-xl p-4 flex flex-col gap-4 shadow-md mb-4">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-bold">Berikutnya dalam antrean</h4>
            <button
              onClick={() => setRightPanelMode("queue")}
              className="text-neutral-400 text-xs font-bold hover:text-white transition-colors"
            >
              Buka antrean
            </button>
          </div>

          <div className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-md cursor-pointer transition-colors group">
            <div className="relative w-12 h-12 flex-shrink-0">
              <img
                src={queue[currentIndex + 1].cover_image}
                alt={queue[currentIndex + 1].title}
                className="w-full h-full object-cover rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                }}
              />
              <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded">
                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
              </div>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-white font-medium text-sm truncate">{queue[currentIndex + 1].title}</span>
              <span className="text-neutral-400 text-xs truncate">{queue[currentIndex + 1].artist}</span>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
