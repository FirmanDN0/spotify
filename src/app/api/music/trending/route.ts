import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
const YoutubeMusicApi = require("youtube-music-api");

let ytApi: any = null;

async function getApi() {
  try {
    if (!ytApi) {
      ytApi = new YoutubeMusicApi();
      await ytApi.initalize();
    }
    return ytApi;
  } catch (error) {
    ytApi = null;
    throw error;
  }
}

// Server-side cache for trending tracks (10 minutes)
let trendingCache: { data: any[]; expires: number } | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const TRENDING_QUERIES = [
  "Cruel Summer Taylor Swift",
  "Flowers Miley Cyrus",
  "Birds of a Feather Billie Eilish",
  "Espresso Sabrina Carpenter",
  "Starboy The Weeknd",
  "Bohemian Rhapsody Queen",
  "Imagine Dragons Believer",
  "Blinding Lights",
];

async function searchSingle(api: any, query: string): Promise<any | null> {
  try {
    let result = await api.search(query, "song");
    if (!result.content || result.content.length === 0) {
      result = await api.search(query);
    }
    return result.content?.[0] || null;
  } catch (err: any) {
    console.warn(`[Trending] Search failed for "${query}":`, err.message);
    return null;
  }
}

export async function GET() {
  // Return cached data if still valid
  if (trendingCache && Date.now() < trendingCache.expires) {
    console.log("[Trending] Serving from cache");
    return NextResponse.json(trendingCache.data);
  }

  try {
    const api = await getApi();

    // Run ALL searches in parallel for maximum speed
    const results = await Promise.allSettled(
      TRENDING_QUERIES.map((q) => searchSingle(api, q))
    );

    const tracks: any[] = [];
    const seenIds = new Set<string>();

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        const track = result.value;
        const id = track.videoId || track.id;
        if (id && !seenIds.has(id)) {
          tracks.push(track);
          seenIds.add(id);
        }
      }
    }

    // Cache the results
    trendingCache = { data: tracks, expires: Date.now() + CACHE_DURATION };
    console.log(`[Trending] Fetched ${tracks.length} tracks, cached for 10min`);

    return NextResponse.json(tracks);
  } catch (err: any) {
    console.error("[Trending] Failed:", err.message);
    
    // If API connection failed, reset and return empty
    if (err.code === "ECONNRESET" || err.message?.includes("ECONNRESET")) {
      ytApi = null;
    }

    // Return stale cache if available
    if (trendingCache) {
      console.log("[Trending] Serving stale cache after error");
      return NextResponse.json(trendingCache.data);
    }

    return NextResponse.json([], { status: 200 }); // Graceful empty response
  }
}
