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
    ytApi = null; // Reset on failure so we can try again
    throw error;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  // Retry up to 2 times on connection errors
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const api = await getApi();
      
      // 1. Try searching strictly for songs to get the best audio matches
      let result = await api.search(query, "song");
      
      // 2. Fallback to general search if no songs found (might be categorized as videos)
      if (!result.content || result.content.length === 0) {
        console.log(`[Search API] No "song" found for query: ${query}. Trying general search...`);
        result = await api.search(query);
      }
      
      return NextResponse.json(result.content || []);
    } catch (err: any) {
      console.error(`[YouTube Music API Error] (attempt ${attempt + 1}):`, err.message || err);
      
      // On connection error, reset API instance and retry after a short delay
      if (err.code === "ECONNRESET" || err.message?.includes("ECONNRESET")) {
        ytApi = null; // Force fresh connection
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      
      return NextResponse.json(
        { error: "Search failed", details: err.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: "Search failed after retries" },
    { status: 500 }
  );
}
