import { json, songs } from "./_lib.js"
export async function onRequest() {
  const m = {}
  songs.forEach((s) => { m[s.category] = (m[s.category] || 0) + 1 })
  const categories = Object.entries(m).map(([id, count]) => ({ id, name: (songs.find((x) => x.category === id) || {}).categoryName || id, count }))
  return json({ count: categories.length, categories })
}
export async function onRequestOptions() { return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" } }) }
