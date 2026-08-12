import { json, songs } from "./_lib.js"
export async function onRequest(context) {
  const url = new URL(context.request.url)
  const limit = parseInt(url.searchParams.get("limit") || "30", 10)
  const m = {}
  songs.forEach((s) => { m[s.artist] = (m[s.artist] || 0) + 1 })
  const artists = Object.entries(m).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, limit)
  return json({ count: artists.length, artists })
}
export async function onRequestOptions() { return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" } }) }
