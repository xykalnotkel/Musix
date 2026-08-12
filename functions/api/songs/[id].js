import { json, songs } from "../_lib.js"
export async function onRequest(context) {
  const id = context.params.id || ""
  const s = songs.find((x) => x.id === id || x.audio.includes(id))
  if (!s) return json({ error: "Lagu tidak ditemukan" }, 404)
  return json(s)
}
export async function onRequestOptions() { return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" } }) }
