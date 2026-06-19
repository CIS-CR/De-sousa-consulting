const API_ORIGIN = "https://api.fbos.org";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

async function proxyApiRequest(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const sourceUrl = new URL(request.url);
  const targetUrl = new URL(sourceUrl.pathname, API_ORIGIN);
  targetUrl.search = sourceUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");

  try {
    const upstream = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
    });
    const responseHeaders = new Headers(upstream.headers);

    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: "FBOS API proxy failed",
        detail: error?.message || "Unknown proxy error",
      },
      { status: 502, headers: corsHeaders }
    );
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return proxyApiRequest(request);
    }

    return env.ASSETS.fetch(request);
  },
};
