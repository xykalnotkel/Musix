import { json, songs, cors } from "./_lib.js"
export async function onRequest(context) {
  return json({ status: "ok", songs: songs.length, time: new Date().toISOString() })
}
export async function onRequestOptions() { return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" } }) }
