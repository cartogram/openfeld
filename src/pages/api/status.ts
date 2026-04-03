import type { APIRoute } from "astro";
import { getStatus } from "../../data/status.js";

export const prerender = false;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const OPTIONS: APIRoute = () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON in request body" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("timestamp" in body) ||
    typeof (body as Record<string, unknown>).timestamp !== "string"
  ) {
    return new Response(
      JSON.stringify({
        error:
          "Missing or invalid 'timestamp' field. Expected an ISO 8601 string.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }

  const date = new Date((body as { timestamp: string }).timestamp);

  if (isNaN(date.getTime())) {
    return new Response(
      JSON.stringify({
        error: "Invalid timestamp. Expected an ISO 8601 string.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }

  const result = getStatus(date);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
};
