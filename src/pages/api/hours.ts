import type { APIRoute } from "astro";
import { HOURS, MONTH_NAMES } from "../../data/hours.js";

export const prerender = false;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const OPTIONS: APIRoute = () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};

export const GET: APIRoute = () => {
  const hours: Record<string, { open: string; close: string }> = {};

  for (const [index, entry] of Object.entries(HOURS)) {
    const name = MONTH_NAMES[Number(index)].toLowerCase();
    hours[name] = { open: entry.open, close: entry.close };
    if (entry.lateClose) {
      (hours[name] as Record<string, string>).late_close = entry.lateClose;
    }
    if (entry.splitDay) {
      (hours[name] as Record<string, string | number>).split_day =
        entry.splitDay;
    }
  }

  return new Response(JSON.stringify({ hours }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
};
