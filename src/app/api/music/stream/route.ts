import { NextRequest, NextResponse } from "next/server";
import { execFileSync } from "child_process";
import path from "path";

export const dynamic = "force-dynamic";

// Cache audio URLs for 5 minutes
const urlCache = new Map<string, { url: string; expires: number }>();

// Resolve yt-dlp binary path dynamically based on OS (Vercel uses Linux)
const isWindows = process.platform === "win32";
const YT_DLP_PATH = path.join(
  process.cwd(),
  "node_modules",
  "youtube-dl-exec",
  "bin",
  isWindows ? "yt-dlp.exe" : "yt-dlp"
);

/**
 * Extract audio URL using yt-dlp as PRIMARY (most reliable).
 * Falls back to ytdl-core only if yt-dlp fails.
 */
// List of Piped API instances to try
const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://api.piped.victr.me",
  "https://pipedapi.tokhmi.xyz",
];

/**
 * Fallback: Get audio URL via Piped API (Highly effective against IP blocks)
 */
async function getPipedAudioUrl(videoId: string): Promise<string | null> {
  for (const instance of PIPED_INSTANCES) {
    try {
      console.log(`[Stream] Trying Piped API via ${instance} for ${videoId}...`);
      const res = await fetch(`${instance}/streams/${videoId}`, {
        next: { revalidate: 3600 }
      });
      if (!res.ok) continue;
      
      const data = await res.json();
      // Piped returns audio-only streams in 'audioStreams'
      const audioStream = data.audioStreams?.find((s: any) => s.format === "M4A" || s.format === "WEB_M") 
                        || data.audioStreams?.[0];
      
      if (audioStream?.url) {
        console.log(`[Stream] Piped API OK (${instance}) for ${videoId}`);
        return audioStream.url;
      }
    } catch (err) {
      console.warn(`[Stream] Piped instance ${instance} failed:`, err);
    }
  }
  return null;
}

async function getAudioUrl(videoId: string): Promise<string | null> {
  const cached = urlCache.get(videoId);
  if (cached && Date.now() < cached.expires) {
    console.log(`[Stream] Cache hit for ${videoId}`);
    return cached.url;
  }

  // Primary: yt-dlp (most reliable, handles DRM & restricted tracks)
  try {
    console.log(`[Stream] Extracting ${videoId} via yt-dlp...`);

    const result = execFileSync(YT_DLP_PATH, [
      `https://www.youtube.com/watch?v=${videoId}`,
      "--dump-single-json",
      "--no-warnings",
      "--no-check-certificate",
      "--extractor-args", "youtube:player_client=android,web",
      "--format", "bestaudio[ext=m4a]/bestaudio/best",
    ], {
      encoding: "utf-8",
      timeout: 25000,
    });

    const output = JSON.parse(result);
    let audioUrl: string | null = output.url || null;

    // If no direct URL, pick from formats list
    if (!audioUrl && output.formats?.length > 0) {
      const audioFormats = output.formats.filter(
        (f: any) => f.acodec !== "none" && f.vcodec === "none"
      );
      const m4a = audioFormats.find((f: any) => f.ext === "m4a");
      const picked = m4a || audioFormats[audioFormats.length - 1];
      audioUrl = picked?.url || null;
    }

    if (audioUrl) {
      console.log(`[Stream] yt-dlp OK for ${videoId}`);
      urlCache.set(videoId, { url: audioUrl, expires: Date.now() + 5 * 60 * 1000 });
      return audioUrl;
    }
  } catch (err: any) {
    console.warn(`[Stream] yt-dlp failed for ${videoId}:`, err.message?.substring(0, 200));
  }

  // Fallback 1: Piped API (Best for Vercel/Serverless)
  const pipedUrl = await getPipedAudioUrl(videoId);
  if (pipedUrl) {
    urlCache.set(videoId, { url: pipedUrl, expires: Date.now() + 5 * 60 * 1000 });
    return pipedUrl;
  }

  // Fallback 2: play-dl (Modern, serverless friendly)
  try {
    console.log(`[Stream] Fallback 2: Trying play-dl for ${videoId}...`);
    const play = require("play-dl");
    const info = await play.video_info(`https://www.youtube.com/watch?v=${videoId}`);
    const stream = await play.stream_from_info(info, { quality: 2 }); // bestaudio

    if (stream?.url) {
      console.log(`[Stream] play-dl OK for ${videoId}`);
      urlCache.set(videoId, { url: stream.url, expires: Date.now() + 5 * 60 * 1000 });
      return stream.url;
    }
  } catch (err: any) {
    console.warn(`[Stream] play-dl fallback failed for ${videoId}:`, err.message);
  }

  // Fallback 2: ytdl-core
  try {
    console.log(`[Stream] Fallback 3: Trying ytdl-core for ${videoId}...`);
    const ytdl = require("@distube/ytdl-core");
    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`, {
      requestOptions: {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        }
      }
    });

    const format = ytdl.chooseFormat(info.formats, {
      filter: "audioonly",
      quality: "highestaudio"
    });

    if (format?.url) {
      console.log(`[Stream] ytdl-core OK for ${videoId}`);
      urlCache.set(videoId, { url: format.url, expires: Date.now() + 5 * 60 * 1000 });
      return format.url;
    }
  } catch (err: any) {
    console.error(`[Stream] ytdl-core fallback failed for ${videoId}:`, err.message);
  }

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id) || id.length > 100) {
    return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
  }

  const audioUrl = await getAudioUrl(id);

  if (!audioUrl) {
    return NextResponse.json(
      { error: "Could not extract audio" },
      { status: 500 }
    );
  }

  // Proxy the audio stream to the browser
  try {
    const rangeHeader = request.headers.get("range");
    const fetchHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Referer": "https://www.youtube.com/",
      "Origin": "https://www.youtube.com",
    };
    if (rangeHeader) {
      fetchHeaders["Range"] = rangeHeader;
    }

    let audioResponse = await fetch(audioUrl, { headers: fetchHeaders });

    // If URL expired, clear cache and retry once
    if (!audioResponse.ok && audioResponse.status !== 206) {
      console.log(`[Stream] URL expired for ${id}, re-extracting...`);
      urlCache.delete(id);
      const freshUrl = await getAudioUrl(id);
      if (!freshUrl) {
        return NextResponse.json({ error: "Re-extract failed" }, { status: 500 });
      }
      audioResponse = await fetch(freshUrl, { headers: fetchHeaders });
    }

    const responseHeaders: Record<string, string> = {
      "Content-Type": audioResponse.headers.get("Content-Type") || "audio/mp4",
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-cache",
    };

    const contentLength = audioResponse.headers.get("Content-Length");
    if (contentLength) responseHeaders["Content-Length"] = contentLength;

    const contentRange = audioResponse.headers.get("Content-Range");
    if (contentRange) responseHeaders["Content-Range"] = contentRange;

    return new NextResponse(audioResponse.body, {
      status: audioResponse.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error("[Proxy Error]:", err.message);
    return NextResponse.json(
      { error: "Stream proxy failed", details: err.message },
      { status: 500 }
    );
  }
}
