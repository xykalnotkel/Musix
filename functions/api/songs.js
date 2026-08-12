import { json, songs } from "./_lib.js"
export async function onRequest(context) {
  const url = new URL(context.request.url)
  let list = [...songs]
  const cat = url.searchParams.get("category")
  const q = url.searchParams.get("q")
  const sort = url.searchParams.get("sort")
  if (cat && cat !== "semua") list = list.filter((s) => s.category === cat)
  if (q) { const k = q.toLowerCase(); list = list.filter((s) => (s.title + " " + s.artist + " " + (s.badge || "")).toLowerCase().includes(k)) }
  if (sort === "random") list = [...list].sort(() => Math.random() - 0.5)
  const offset = parseInt(url.searchParams.get("offset") || "0", 10)
  const limit = parseInt(url.searchParams.get("limit") || "50", 10)
  return json({ count: list.length, limit, offset, songs: list.slice(offset, offset + limit) })
}
export async function onRequestOptions() { return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" } }) }
