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
    
    // 1. Try searching strictly as a song
    let result = await api.search(id, "song");
    
    // 2. Fallback to general search if no song found (might be a "video" type)
    if (!result.content || result.content.length === 0) {
      console.log(`[Track API] No "song" found for ID: ${id}. Trying general search...`);
      result = await api.search(id);
    }
    
    if (result.content && result.content.length > 0) {
      // Find exact ID match if possible, otherwise take first
      const exactMatch = result.content.find((t: any) => t.videoId === id || t.id === id);
      return NextResponse.json(exactMatch || result.content[0]);
    }
    
    // 3. Final fallback: Use yt-dlp to get metadata if the ID exists but search failed
    try {
      console.log(`[Track API] Search failed for ${id}. Falling back to yt-dlp metadata...`);
      const { execFileSync } = require("child_process");
      const path = require("path");
      
      const isWindows = process.platform === "win32";
      const YT_DLP_PATH = path.join(
        process.cwd(),
        "node_modules",
        "youtube-dl-exec",
        "bin",
        isWindows ? "yt-dlp.exe" : "yt-dlp"
      );
      
      const output = execFileSync(YT_DLP_PATH, [
        `https://www.youtube.com/watch?v=${id}`,
        "--dump-single-json",
        "--no-warnings",
        "--extractor-args", "youtube:player_client=android,web",
      ], { encoding: "utf-8", timeout: 10000 });
      
      const data = JSON.parse(output);
      
      // Map yt-dlp data to what our normalizeTrack expects (partially)
      return NextResponse.json({
        videoId: data.id,
        name: data.title,
        artist: { name: data.uploader || data.artist },
        album: { name: "YouTube" },
        thumbnails: data.thumbnails,
        duration: data.duration * 1000,
      });
    } catch (fallbackErr) {
      console.error("[Track API] yt-dlp fallback failed:", fallbackErr);
    }

    console.warn(`[Track API] Track not found for ID: ${id}`);
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  } catch (err: any) {
    console.error("[YouTube Music API Error]:", err);
    return NextResponse.json(
      { error: "Fetch failed", details: err.message },
      { status: 500 }
    );
  }
}
