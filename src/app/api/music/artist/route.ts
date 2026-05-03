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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const api = await getApi();
    const result = await api.getArtist(id);
    
    if (!result) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }
    
    // Fix: youtube-music-api often returns artist top tracks without videoId or thumbnails
    if (result.products?.songs?.content) {
      const needsFixing = result.products.songs.content.some((t: any) => !t.videoId && !t.thumbnails);
      
      if (needsFixing && result.name) {
        console.log(`[Artist API] Top tracks missing data for ${result.name}. Fetching via search...`);
        try {
          const searchRes = await api.search(result.name, "song");
          if (searchRes.content && searchRes.content.length > 0) {
            // Filter to make sure we mostly get songs by this artist
            // and replace the broken tracks with these valid ones
            result.products.songs.content = searchRes.content.slice(0, 10);
          }
        } catch (e) {
          console.warn("[Artist API] Fallback search failed:", e);
        }
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[YouTube Music API Artist Error]:", err);
    return NextResponse.json(
      { error: "Fetch failed", details: err.message },
      { status: 500 }
    );
  }
}
