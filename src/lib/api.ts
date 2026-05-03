export interface Track {
  id: string; // MUST be unique
  title: string;
  artist: string;
  artistId?: string; // YouTube Music browseId
  album: string;
  albumId?: string;
  cover_image: string;
  audio_url: string;
  duration: number;
  popularity?: number;
}

export interface Artist {
  id: string;
  name: string;
  thumbnails: { url: string; width: number; height: number }[];
  description?: string;
  topTracks: Track[];
  albums: { id: string; title: string; thumbnails: any[] }[];
  singles: { id: string; title: string; thumbnails: any[] }[];
  relatedArtists: { id: string; name: string; thumbnails: any[] }[];
}

export interface AlbumDetail {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  year?: string;
  description?: string;
  thumbnails: any[];
  tracks: Track[];
}

export const API_BASE_URL = "/api/music";
export const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop";

/**
 * Normalize the YouTube Music API response into our internal Track structure.
 */
function normalizeTrack(data: any): Track {
  const videoId = data.videoId || data.id;
  
  // Extract highest quality thumbnail
  // Priority: 1. Album thumbnails (usually the actual cover art)
  //           2. Track thumbnails (might be artist profile pic in some API responses)
  let cover_image = FALLBACK_IMAGE;

  const thumbnails = (data.album?.thumbnails?.length > 0)
    ? data.album.thumbnails
    : (data.thumbnails?.length > 0) ? data.thumbnails : [];

  if (thumbnails.length > 0) {
    cover_image = getBestThumbnail(thumbnails);
  } else if (videoId) {
    // Fallback to official YouTube thumbnail (HQ) if API provided no thumbnails
    cover_image = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }

  // Handle artist
  let artist = "Unknown Artist";
  let artistId = "";

  if (data.artist) {
    if (Array.isArray(data.artist)) {
      artist = data.artist.map((a: any) => a.name).join(", ");
      artistId = data.artist[0]?.browseId || data.artist[0]?.id || "";
    } else {
      artist = data.artist.name || artist;
      artistId = data.artist.browseId || data.artist.id || "";
    }
  } else if (data.author) {
    artist = typeof data.author === "string" ? data.author : "Unknown Artist";
  }

  // Generate the real audio streaming URL

  if (!videoId) {
    console.warn("[API] Missing videoId in track data:", data);
  }

  const stableId = videoId || `temp-${Math.random().toString(36).substring(7)}`;
  const audio_url = `/api/music/stream?id=${stableId}`;

  // Handle album - YouTube Music API often returns artist name as album name with artist browseId
  let albumName = "Single";
  let albumId: string | undefined = undefined;

  if (data.album && data.album.name) {
    const rawBrowseId = data.album.browseId || data.album.id;
    const albumBrowseId = typeof rawBrowseId === "string" ? rawBrowseId : "";

    // Check if "album" is actually the artist (same name & same browseId)
    const isFakeAlbum = (
      data.album.name === artist && albumBrowseId === artistId
    ) || (
        albumBrowseId.startsWith("UC") // YouTube channel IDs start with UC, not album IDs
      );

    if (!isFakeAlbum && data.album.name !== artist) {
      albumName = data.album.name;
      albumId = albumBrowseId || undefined;
    }
  }

  return {
    id: stableId,
    title: data.name || data.title || "Unknown Title",
    artist,
    artistId,
    album: albumName,
    albumId,
    cover_image,
    audio_url,
    duration: data.duration ? Math.round(parseInt(data.duration) / 1000) : 0,
    popularity: 0,
  };
}

/**
 * Get the best thumbnail URL from an array of thumbnails.
 */
function getBestThumbnail(thumbnails: any[]): string {
  if (!thumbnails || thumbnails.length === 0) return FALLBACK_IMAGE;
  
  // 1. Try to find official Music API art (usually lh3.googleusercontent.com)
  // These are consistently square and high quality.
  const officialArt = thumbnails.filter(t => t.url?.includes('googleusercontent.com'));
  if (officialArt.length > 0) {
    const sorted = [...officialArt].sort((a, b) => ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0)));
    return sorted[0].url;
  }
  
  // 2. Otherwise sort by width/height descending
  const sorted = [...thumbnails].sort((a, b) => {
    const areaA = (a.width || 0) * (a.height || 0);
    const areaB = (b.width || 0) * (b.height || 0);
    return areaB - areaA;
  });
  
  let url = sorted[0].url;
  if (url && typeof url === "string") {
    if (url.startsWith("//")) url = `https:${url}`;
    return url;
  }
  
  return FALLBACK_IMAGE;
}

/**
 * Unified Search Function with AbortController support.
 */
export async function searchTracks(query: string, signal?: AbortSignal): Promise<Track[]> {
  if (!query.trim()) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`, { signal });
    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch {
        errorData = { message: await res.text().catch(() => "Unknown error") };
      }
      console.error(`[API] Search failed (${res.status} ${res.statusText}):`, errorData);
      throw new Error(`Search API failed: ${res.status}`);
    }

    const items = await res.json();
    return items.map((item: any) => normalizeTrack(item));
  } catch (err: any) {
    if (err.name === "AbortError") return [];
    console.error("Search failed:", err);
    return [];
  }
}

/**
 * Fetches track details using the song ID
 */
export async function fetchTrack(id: string, signal?: AbortSignal): Promise<Track | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/track?id=${encodeURIComponent(id)}`, { signal });
    if (!res.ok) return null;

    const item = await res.json();
    return normalizeTrack(item);
  } catch (err: any) {
    if (err.name === "AbortError") return null;
    console.error("Fetch track failed:", err);
    return null;
  }
}

/**
 * Fetch trending tracks to populate the homepage.
 */
export async function getTrendingTracks(): Promise<Track[]> {
  const queries = [
    "Cruel Summer Taylor Swift", 
    "Flowers Miley Cyrus", 
    "Birds of a Feather Billie Eilish",
    "Espresso Sabrina Carpenter",
    "Starboy The Weeknd",
    "Bohemian Rhapsody Queen",
    "Imagine Dragons Believer",
    "Blinding Lights"
  ];
  const tracks: Track[] = [];
  const seenIds = new Set<string>();

  for (const q of queries) {
    try {
      const results = await searchTracks(q);
      if (results.length > 0) {
        const t = results[0];
        if (!seenIds.has(t.id)) {
          tracks.push(t);
          seenIds.add(t.id);
        }
      }
      // Small delay to avoid ECONNRESET from YouTube Music API
      await new Promise(r => setTimeout(r, 300));
    } catch {
      // Skip failed queries silently
    }
  }

  return tracks;
}

/**
 * Fetches artist details and their music.
 */
export async function fetchArtist(id: string): Promise<Artist | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/artist?id=${encodeURIComponent(id)}`);
    if (!res.ok) return null;

    const data = await res.json();

    return {
      id: data.browseId || data.id || id,
      name: data.name,
      thumbnails: data.thumbnails || [],
      description: data.description,
      topTracks: (data.products?.songs?.content || []).map((item: any) => normalizeTrack(item)),
      albums: (data.products?.albums?.content || []).map((item: any) => ({
        id: item.browseId || item.id,
        title: item.name || item.title,
        thumbnails: item.thumbnails || []
      })),
      singles: (data.products?.singles?.content || []).map((item: any) => ({
        id: item.browseId || item.id,
        title: item.name || item.title,
        thumbnails: item.thumbnails || []
      })),
      relatedArtists: (data.products?.related?.content || data.relatedArtists || []).map((item: any) => ({
        id: item.browseId || item.id || "",
        name: item.name || item.title || "Unknown",
        thumbnails: item.thumbnails || []
      }))
    };
  } catch (err: any) {
    console.error("Fetch artist failed:", err);
    return null;
  }
}

/**
 * Fetches album details and its tracklist.
 */
export async function fetchAlbum(id: string): Promise<AlbumDetail | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/album?id=${encodeURIComponent(id)}`);
    if (!res.ok) return null;

    const data = await res.json();

    // Extract artist name from multiple possible fields (youtube-music-api vs yt-dlp)
    let albumArtistName = "Unknown Artist";
    let albumArtistId: string | undefined;

    if (typeof data.artist === "string" && data.artist) {
      albumArtistName = data.artist;
    } else if (data.artist?.name) {
      albumArtistName = data.artist.name;
      albumArtistId = data.artist.browseId || data.artist.id;
    }
    // yt-dlp fallback fields
    if (albumArtistName === "Unknown Artist") {
      albumArtistName = data.channel || data.uploader || data.creator || "Unknown Artist";
    }

    // Clean up title (yt-dlp sometimes adds "Album - " prefix)
    let albumTitle = data.title || "Unknown Album";
    albumTitle = albumTitle.replace(/^Album\s*-\s*/i, "").trim();

    // Extract year from multiple possible fields
    const year = data.year || data.release_year || data.upload_date?.substring(0, 4);

    // Normalize tracks
    const tracks = (data.tracks || []).map((t: any) => {
      const trackArtist = t.artist || { name: albumArtistName };

      return normalizeTrack({
        ...t,
        artist: trackArtist,
        album: { name: albumTitle, browseId: data.browseId || id }
      });
    });

    // If artist is still unknown, try to get it from the first track
    if (albumArtistName === "Unknown Artist" && tracks.length > 0) {
      albumArtistName = tracks[0].artist || "Unknown Artist";
    }

    // Ensure we have thumbnails - fallback to first track's cover
    let albumThumbnails = data.thumbnails || [];
    
    // If the album only has video thumbnails but the first track has official music art, prefer the track's art.
    const hasOfficialArt = albumThumbnails.some((t: any) => t.url?.includes('googleusercontent.com'));
    if (!hasOfficialArt && tracks.length > 0) {
      const firstTrackCover = tracks[0].cover_image;
      if (firstTrackCover.includes('googleusercontent.com')) {
        albumThumbnails = [{ url: firstTrackCover }];
      }
    }

    if (albumThumbnails.length === 0 && tracks.length > 0) {
      albumThumbnails = [{ url: tracks[0].cover_image }];
    }

    return {
      id: data.browseId || data.id || id,
      title: albumTitle,
      artist: albumArtistName,
      artistId: albumArtistId,
      year,
      description: data.description,
      thumbnails: albumThumbnails,
      tracks
    };
  } catch (err: any) {
    console.error("Fetch album failed:", err);
    return null;
  }
}

/**
 * Fetches lyrics from LRCLIB API.
 */
export async function fetchLyrics(trackName: string, artistName: string): Promise<{ syncedLyrics?: string; plainLyrics?: string } | null> {
  try {
    // Basic cleanup of track names (remove (feat...), [Official Video], etc) to improve match rate
    let cleanTrackName = trackName.replace(/\([^)]+\)|\[[^\]]+\]/g, "").trim();
    let cleanArtistName = artistName.split(',')[0].trim(); // Just use the primary artist

    const url = new URL('https://lrclib.net/api/get');
    url.searchParams.append('track_name', cleanTrackName);
    url.searchParams.append('artist_name', cleanArtistName);

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = await res.json();
    return {
      syncedLyrics: data.syncedLyrics,
      plainLyrics: data.plainLyrics
    };
  } catch (err) {
    console.error("Fetch lyrics failed:", err);
    return null;
  }
}
