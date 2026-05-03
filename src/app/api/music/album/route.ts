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
    const result = await api.getAlbum(id);

    // Check if youtube-music-api returned useful data
    const hasUsefulData = result && result.tracks && result.tracks.length > 0
      && result.tracks.some((t: any) => t.videoId || t.name);

    if (hasUsefulData) {
      // Extract artist from tracks if top-level artist is missing
      let artist = result.artist;
      if (!artist || (Array.isArray(artist) && artist.length === 0)) {
        const firstTrackWithArtist = result.tracks.find((t: any) => t.artist);
        if (firstTrackWithArtist?.artist) {
          artist = firstTrackWithArtist.artist;
        }
      }

      return NextResponse.json({
        ...result,
        artist,
        browseId: id
      });
    }

    // Fallback: yt-dlp for album data
    console.log(`[Album API] youtube-music-api insufficient for ${id}, trying yt-dlp...`);

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

    const ytUrl = `https://music.youtube.com/browse/${id}`;
    const raw = execFileSync(YT_DLP_PATH, [
      ytUrl,
      "--dump-single-json",
      "--flat-playlist",
      "--no-warnings",
      "--no-check-certificate",
      "--extractor-args", "youtube:player_client=android,web",
    ], {
      encoding: "utf-8",
      timeout: 25000,
    });

    const data = JSON.parse(raw);

    // Clean title (remove "Album - " prefix that yt-dlp adds)
    let title = data.title || "Unknown Album";
    title = title.replace(/^Album\s*[-–]\s*/i, "").trim();

    // Extract artist name
    const artist = data.channel || data.uploader || data.creator || "Unknown Artist";

    // Build tracks from entries
    const tracks = (data.entries || []).map((entry: any, index: number) => ({
      videoId: entry.id || entry.url?.split("v=")[1],
      name: entry.title,
      artist: { name: entry.channel || artist },
      album: { name: title },
      duration: entry.duration ? String(Math.round(entry.duration * 1000)) : "0",
      thumbnails: entry.thumbnails || [],
      trackNumber: index + 1,
    }));

    // Use the best available thumbnail
    const thumbnails = data.thumbnails || [];
    if (thumbnails.length === 0 && tracks.length > 0 && tracks[0].thumbnails?.length > 0) {
      thumbnails.push(...tracks[0].thumbnails);
    }

    return NextResponse.json({
      title,
      artist,
      year: data.release_year || data.modified_date?.substring(0, 4) || data.upload_date?.substring(0, 4),
      description: data.description,
      thumbnails,
      tracks,
      trackCount: tracks.length,
      browseId: id,
    });
  } catch (err: any) {
    console.error("[Album API Error]:", err.message?.substring(0, 300) || err);
    return NextResponse.json(
      { error: "Fetch failed", details: err.message },
      { status: 500 }
    );
  }
}
