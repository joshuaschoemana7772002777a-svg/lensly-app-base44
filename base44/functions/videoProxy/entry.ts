Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const videoUrl = url.searchParams.get("url");

    if (!videoUrl) {
      return Response.json({ error: "Missing url parameter" }, { status: 400 });
    }

    const response = await fetch(videoUrl);
    
    if (!response.ok) {
      return Response.json({ error: "Failed to fetch video" }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "video/mp4";
    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});