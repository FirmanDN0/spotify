"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchArtist, Artist } from "@/lib/api";
import { TrackCard } from "@/components/TrackCard";
import { Loader2, Music, User } from "lucide-react";
import Link from "next/link";
import { useImageColor } from "@/hooks/useImageColor";

export default function ArtistPage() {
  const { id } = useParams();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadArtist = async () => {
      setIsLoading(true);
      try {
        const data = await fetchArtist(id as string);
        setArtist(data);
      } catch (error) {
        console.error("Failed to load artist:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadArtist();
  }, [id]);

  const headerImage = artist?.thumbnails?.[artist.thumbnails.length - 1]?.url;
  const bgColor = useImageColor(headerImage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
        <User className="w-20 h-20 mb-4 opacity-20" />
        <h2 className="text-2xl font-bold text-white mb-2">Artis tidak ditemukan</h2>
        <p>Maaf, kami tidak bisa menemukan profil artis ini.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-20 -mt-4 -mx-4 md:-mt-8 md:-mx-8 relative">
      {/* Dynamic Background Gradient */}
      <div 
        className="absolute top-0 left-0 right-0 h-[500px] md:h-[800px] pointer-events-none opacity-30 transition-colors duration-1000 z-0"
        style={{
          background: `linear-gradient(to bottom, ${bgColor} 0%, transparent 100%)`
        }}
      />

      {/* Header Banner */}
      <div className="relative h-[200px] sm:h-[300px] md:h-[450px] overflow-hidden group z-10">
        {headerImage ? (
          <img 
            src={headerImage} 
            alt={artist.name}
            className="w-full h-full object-cover scale-105 group-hover:scale-100 transition duration-1000"
          />
        ) : (
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
            <User className="w-20 sm:w-32 h-20 sm:h-32 text-neutral-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-4 sm:p-8 md:p-12 w-full">
          <div className="flex items-center gap-2 mb-1 md:mb-2">
            <div className="p-1 bg-cyan-500 rounded-full shadow-lg">
              <User className="w-3 h-3 text-black fill-current" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-cyan-400">Verified Artist</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-8xl font-black tracking-tighter text-white drop-shadow-2xl">
            {artist.name}
          </h1>
        </div>
      </div>

      <div className="p-4 sm:p-8 md:p-12 flex flex-col gap-8 md:gap-12 relative z-10">
        {/* Top Tracks */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center gap-3">
            <Music className="w-5 h-5 md:w-6 md:h-6 text-cyan-500" />
            Lagu Terpopuler
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
            {artist.topTracks.slice(0, 10).map((track) => (
              <TrackCard 
                key={track.id} 
                track={track} 
                contextQueue={artist.topTracks} 
                contextType="homepage" 
              />
            ))}
          </div>
        </section>

        {/* Albums */}
        {artist.albums.length > 0 && (
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Album</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
              {artist.albums.map((album) => (
                <Link 
                  key={album.id} 
                  href={`/album/${album.id}`}
                  className="group flex flex-col gap-2 md:gap-3 bg-neutral-900/40 p-3 md:p-4 rounded-xl border border-transparent hover:border-neutral-700 transition cursor-pointer"
                >
                  <div className="aspect-square rounded-lg overflow-hidden shadow-lg bg-neutral-800">
                    <img 
                      src={album.thumbnails?.[album.thumbnails.length - 1]?.url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300"} 
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    />
                  </div>
                  <h3 className="font-bold text-white text-sm md:text-base truncate group-hover:text-cyan-400 transition">{album.title}</h3>
                  <p className="text-xs md:text-sm text-neutral-400">Album</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Singles */}
        {artist.singles.length > 0 && (
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Singles & EPs</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
              {artist.singles.map((single) => (
                <Link 
                  key={single.id} 
                  href={`/album/${single.id}`}
                  className="group flex flex-col gap-2 md:gap-3 bg-neutral-900/40 p-3 md:p-4 rounded-xl border border-transparent hover:border-neutral-700 transition cursor-pointer"
                >
                  <div className="aspect-square rounded-lg overflow-hidden shadow-lg bg-neutral-800">
                    <img 
                      src={single.thumbnails?.[single.thumbnails.length - 1]?.url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300"} 
                      alt={single.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    />
                  </div>
                  <h3 className="font-bold text-white text-sm md:text-base truncate group-hover:text-cyan-400 transition">{single.title}</h3>
                  <p className="text-xs md:text-sm text-neutral-400">Single</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related Artists */}
        {artist.relatedArtists.length > 0 && (
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Fans Might Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
              {artist.relatedArtists.map((ra) => (
                <Link 
                  key={ra.id} 
                  href={`/artist/${ra.id}`}
                  className="group flex flex-col items-center gap-2 md:gap-3 bg-neutral-900/40 p-3 md:p-4 rounded-xl border border-transparent hover:border-neutral-700 transition cursor-pointer"
                >
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-lg bg-neutral-800">
                    <img 
                      src={ra.thumbnails?.[ra.thumbnails.length - 1]?.url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300"} 
                      alt={ra.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    />
                  </div>
                  <h3 className="font-bold text-white text-sm md:text-base text-center truncate w-full group-hover:text-cyan-400 transition">{ra.name}</h3>
                  <p className="text-xs md:text-sm text-neutral-400">Artist</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
