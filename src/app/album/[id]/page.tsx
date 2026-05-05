"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchAlbum, AlbumDetail, FALLBACK_IMAGE } from "@/lib/api";
import { usePlayerStore } from "@/lib/store";
import { Play, Pause, Clock, Calendar, Disc, Loader2, User, Music, Heart, ListPlus } from "lucide-react";
import { useImageColor } from "@/hooks/useImageColor";
import { useToastStore } from "@/lib/toast";

export default function AlbumPage() {
  const { id } = useParams();
  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { playTrack, currentTrack, isPlaying, setHasInteracted, favorites, toggleFavorite, appendQueue, queue } = usePlayerStore();
  const { showToast } = useToastStore();

  useEffect(() => {
    if (!id) return;

    const loadAlbum = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAlbum(id as string);
        setAlbum(data);
      } catch (error) {
        console.error("Failed to load album:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAlbum();
  }, [id]);

  // Pick the best thumbnail (largest)
  const getBestThumbnail = (thumbnails: any[]) => {
    if (!thumbnails || thumbnails.length === 0) return null;
    const sorted = [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
    return sorted[0].url;
  };

  const albumCover = getBestThumbnail(album?.thumbnails || [])
    || album?.tracks?.[0]?.cover_image
    || FALLBACK_IMAGE;

  const bgColor = useImageColor(albumCover);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
        <Disc className="w-20 h-20 mb-4 opacity-20" />
        <h2 className="text-2xl font-bold text-white mb-2">Album tidak ditemukan</h2>
        <p>Maaf, kami tidak bisa menemukan detail album ini.</p>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayAlbum = () => {
    if (album.tracks.length > 0) {
      setHasInteracted();
      playTrack(album.tracks[0], album.tracks, "homepage");
    }
  };

  return (
    <div className="flex flex-col pb-20 relative">
      {/* Dynamic Background Gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-[350px] md:h-[500px] pointer-events-none opacity-40 transition-colors duration-1000"
        style={{
          background: `linear-gradient(to bottom, ${bgColor} 0%, transparent 100%)`
        }}
      />

      {/* Header Section */}
      <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-5 md:gap-8 mb-8 md:mb-10 pt-4 md:pt-8 px-2 md:px-8 rounded-3xl z-10">
        <div className="w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64 flex-shrink-0 shadow-2xl rounded-2xl overflow-hidden relative group">
          <img
            src={albumCover}
            alt={album.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <button
              onClick={handlePlayAlbum}
              className="w-14 h-14 md:w-16 md:h-16 bg-cyan-500 text-black rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition"
            >
              <Play className="w-7 h-7 md:w-8 md:h-8 fill-current ml-1" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:gap-4 text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Album</span>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter text-white">
            {album.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 md:gap-x-6 gap-y-2 text-sm font-medium text-neutral-300">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center">
                <User className="w-3 h-3 text-neutral-400" />
              </div>
              {album.artistId ? (
                <Link href={`/artist/${album.artistId}`} className="hover:text-white hover:underline transition">
                  {album.artist}
                </Link>
              ) : (
                <span>{album.artist}</span>
              )}
            </div>

            {album.year && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-500" />
                <span>{album.year}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-neutral-500" />
              <span>{album.tracks.length} Lagu</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description if any */}
      {album.description && (
        <div className="px-4 mb-8 md:mb-10 relative z-10">
          <p className="text-neutral-400 text-sm leading-relaxed max-w-3xl line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">
            {album.description}
          </p>
        </div>
      )}

      {/* Tracklist Table */}
      <div className="flex flex-col relative z-10">
        {/* Table Header — hidden on mobile */}
        <div className="hidden sm:grid grid-cols-[16px_1fr_120px] gap-4 px-4 py-2 border-b border-neutral-800 text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
          <div className="text-center">#</div>
          <div>Judul</div>
          <div className="text-right flex items-center justify-end gap-2">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {album.tracks.map((track, index) => {
          const isCurrent = currentTrack?.id === track.id;
          const validFavorites = favorites.filter((f) => typeof f === 'object' && f !== null);
          const isFav = validFavorites.some((f) => f.id === track.id);

          return (
            <div
              key={track.id}
              onClick={() => {
                setHasInteracted();
                playTrack(track, album.tracks, "homepage");
              }}
              className={`flex items-center gap-3 sm:grid sm:grid-cols-[16px_1fr_120px] sm:gap-4 px-3 sm:px-4 py-3 rounded-lg transition group cursor-pointer ${isCurrent ? "bg-neutral-800/60" : "hover:bg-neutral-800/30"
                }`}
            >
              {/* Track Number — hidden on mobile */}
              <div className="hidden sm:flex items-center justify-center text-sm font-medium text-neutral-500 group-hover:hidden">
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

              {/* Track Info */}
              <div className="flex flex-col min-w-0 flex-1">
                <span className={`font-bold truncate text-sm sm:text-base ${isCurrent ? "text-cyan-400" : "text-white"}`}>
                  {track.title}
                </span>
                <span className="text-xs text-neutral-400 truncate">
                  {track.artist}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 sm:gap-6 text-sm font-medium text-neutral-500 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (queue.some(t => t.id === track.id)) {
                      showToast("Sudah ada di antrean");
                    } else {
                      appendQueue([track]);
                      showToast("Ditambahkan ke antrean");
                    }
                  }}
                  className="hover:text-white transition opacity-0 group-hover:opacity-100"
                  title="Tambahkan ke antrean"
                >
                  <ListPlus className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(track);
                  }}
                  className={`hover:text-white transition opacity-0 group-hover:opacity-100 ${isFav ? "text-cyan-500 opacity-100" : ""}`}
                >
                  <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
                </button>
                <span className="w-10 text-right hidden sm:inline">{formatDuration(track.duration)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
