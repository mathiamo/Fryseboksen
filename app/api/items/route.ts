import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { freezerItems } from "../../../db/schema";
import { ensureSchema } from "../../../db/ensure";
import { getRuntimeEnv } from "../../../db/runtime";
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
export async function GET() { try { await ensureSchema(); const items = await getDb().select().from(freezerItems).orderBy(desc(freezerItems.frozenOn), desc(freezerItems.id)); return Response.json({ items }); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Kunne ikke laste inn varene" }, { status: 500 }); } }
export async function POST(request: Request) { try {
  await ensureSchema();
  const form = await request.formData(); const name = String(form.get("name") || "").trim(); const frozenOn = String(form.get("frozenOn") || ""); const quantity = Number(form.get("quantity") || 1); const useWithinDays = Number(form.get("useWithinDays") || 90); const category = String(form.get("category") || "Other"); const image = form.get("image");
  if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(frozenOn)) return Response.json({ error: "Navn og nedfrysingsdato er påkrevd" }, { status: 400 });
  if (!(image instanceof File) || !allowedTypes.has(image.type) || image.size > 8_000_000) return Response.json({ error: "Velg et JPG-, PNG- eller WebP-bilde under 8 MB" }, { status: 400 });
  const extension = image.type.split("/")[1].replace("jpeg", "jpg"); const imageKey = `${crypto.randomUUID()}.${extension}`;
  await getRuntimeEnv().BUCKET.put(imageKey, await image.arrayBuffer(), { httpMetadata: { contentType: image.type } });
  try { const [item] = await getDb().insert(freezerItems).values({ name, frozenOn, quantity: Math.min(99, Math.max(1, quantity)), useWithinDays, category, imageKey }).returning(); return Response.json({ item }, { status: 201 }); }
  catch (error) { await getRuntimeEnv().BUCKET.delete(imageKey); throw error; }
} catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Kunne ikke lagre varen" }, { status: 500 }); } }
