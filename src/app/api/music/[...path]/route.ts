import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const targetPath = path.map(encodeURIComponent).join("/");
  
  // Create target URL
  const targetUrl = new URL(`https://bhindi1.ddns.net/music/api/${targetPath}`);
  
  console.log("[PROXY] Fetching:", targetUrl.toString());
  
  // Forward search params
  const searchParams = request.nextUrl.searchParams;
  searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  try {
    const response = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      console.error(`[PROXY] Error ${response.status} from target:`, await response.text());
      return NextResponse.json(
        { error: `API responded with status ${response.status}` },
        { status: response.status }
      );
    }

    // Attempt to parse JSON, if it fails, maybe it returns text
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text }; // Fallback for plain text responses
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Proxy Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
