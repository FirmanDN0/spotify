import { NextRequest, NextResponse } from "next/server";
import { execFileSync } from "child_process";
import path from "path";
import play from "play-dl";

export const dynamic = "force-dynamic";

const isWindows = process.platform === "win32";
const YT_DLP_PATH = path.join(
  process.cwd(),
  "node_modules",
  "youtube-dl-exec",
  "bin",
  isWindows ? "yt-dlp.exe" : "yt-dlp"
);

async function getAudioUrl(videoId: string): Promise<string | null> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // 1. Try yt-dlp (works best locally)
  try {
    console.log(`[Stream] Trying yt-dlp for ${videoId}...`);
    const result = execFileSync(YT_DLP_PATH, [
      videoUrl,
      "--dump-single-json",
      "--no-warnings",
      "--format", "bestaudio[ext=m4a]/bestaudio/best",
    ], { encoding: "utf-8", timeout: 10000 });
    
    const output = JSON.parse(result);
    if (output.url) {
      console.log(`[Stream] yt-dlp success for ${videoId}`);
      return output.url;
    }
  } catch (err: any) {
    console.warn(`[Stream] yt-dlp failed:`, err.message?.substring(0, 100));
  }

  // 2. Try play-dl (better for Vercel)
  try {
    console.log(`[Stream] Trying play-dl for ${videoId}...`);
    const info = await play.video_info(videoUrl);
    // Find highest bitrate audio format that has a URL
    const format = info.format
      .filter(f => f.mimeType?.includes('audio') && f.url)
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
    
    if (format?.url) {
      console.log(`[Stream] play-dl success for ${videoId}`);
      return format.url;
    }
  } catch (err: any) {
    console.error(`[Stream] play-dl failed:`, err.message);
  }

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const audioUrl = await getAudioUrl(id);

  if (!audioUrl) {
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }

  try {
    const rangeHeader = request.headers.get("range");
    const fetchHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Referer": "https://www.youtube.com/",
    };
    
    if (rangeHeader) fetchHeaders["Range"] = rangeHeader;

    const audioResponse = await fetch(audioUrl, { headers: fetchHeaders });
    
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", audioResponse.headers.get("Content-Type") || "audio/mp4");
    responseHeaders.set("Accept-Ranges", "bytes");
    
    const contentRange = audioResponse.headers.get("Content-Range");
    if (contentRange) responseHeaders.set("Content-Range", contentRange);
    
    const contentLength = audioResponse.headers.get("Content-Length");
    if (contentLength) responseHeaders.set("Content-Length", contentLength);

    return new NextResponse(audioResponse.body, {
      status: audioResponse.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

