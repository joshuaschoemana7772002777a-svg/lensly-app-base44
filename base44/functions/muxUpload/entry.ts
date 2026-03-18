import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MUX_TOKEN_ID = Deno.env.get("MUX_TOKEN_ID");
const MUX_TOKEN_SECRET = Deno.env.get("MUX_TOKEN_SECRET");
const MUX_BASE = "https://api.mux.com";

const muxHeaders = () => ({
  "Authorization": `Basic ${btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`)}`,
  "Content-Type": "application/json",
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { action, asset_id } = await req.json();

    // --- Create a direct upload URL ---
    if (action === "create_upload") {
      const res = await fetch(`${MUX_BASE}/video/v1/uploads`, {
        method: "POST",
        headers: muxHeaders(),
        body: JSON.stringify({
          cors_origin: "*",
          new_asset_settings: {
            playback_policy: ["public"],
            mp4_support: "capped-1080p",
          },
          timeout: 3600,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: `Mux error: ${err}` }, { status: 500 });
      }

      const data = await res.json();
      return Response.json({
        upload_id: data.data.id,
        upload_url: data.data.url,
        asset_id: data.data.asset_id || null,
      });
    }

    // --- Poll asset status ---
    if (action === "get_asset" && asset_id) {
      const res = await fetch(`${MUX_BASE}/video/v1/assets/${asset_id}`, {
        headers: muxHeaders(),
      });

      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: `Mux error: ${err}` }, { status: 500 });
      }

      const data = await res.json();
      const asset = data.data;
      const playbackId = asset.playback_ids?.[0]?.id;

      return Response.json({
        asset_id: asset.id,
        status: asset.status, // "preparing" | "ready" | "errored"
        playback_url: playbackId
          ? `https://stream.mux.com/${playbackId}.m3u8`
          : null,
        mp4_url: playbackId
          ? `https://stream.mux.com/${playbackId}/high.mp4`
          : null,
        thumbnail_url: playbackId
          ? `https://image.mux.com/${playbackId}/thumbnail.jpg?width=640&height=640&fit_mode=smartcrop&time=1`
          : null,
        playback_id: playbackId || null,
        duration: asset.duration || null,
      });
    }

    // --- Get upload status (to retrieve asset_id after upload) ---
    if (action === "get_upload" && asset_id) {
      // here asset_id is actually upload_id
      const res = await fetch(`${MUX_BASE}/video/v1/uploads/${asset_id}`, {
        headers: muxHeaders(),
      });

      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: `Mux error: ${err}` }, { status: 500 });
      }

      const data = await res.json();
      return Response.json({
        upload_id: data.data.id,
        asset_id: data.data.asset_id || null,
        status: data.data.status, // "waiting" | "asset_created" | "errored" | "timed_out"
      });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});