import { getRuntimeEnv } from "../../../../db/runtime";
export async function GET(_request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params; if (!/^[a-zA-Z0-9-]+\.(jpg|png|webp)$/.test(key)) return new Response("Not found", { status: 404 });
  const object = await getRuntimeEnv().BUCKET.get(key); if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers(); object.writeHttpMetadata(headers); headers.set("Cache-Control", "public, max-age=31536000, immutable"); headers.set("ETag", object.httpEtag); return new Response(object.body, { headers });
}
