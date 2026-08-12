import { json, songs, pickRandom, makeStory } from "./_lib.js"
export async function onRequest(context) {
  const url = new URL(context.request.url)
  const cat = url.searchParams.get("category")
  let pool = songs
  if (cat && cat !== "semua") pool = pool.filter((s) => s.category === cat)
  if (!pool.length) return json({ error: "Kategori kosong" }, 404)
  return json(makeStory(pickRandom(pool)))
}
export async function onRequestOptions() { return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" } }) }
