import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { freezerItems } from "../../../../db/schema";
import { ensureSchema } from "../../../../db/ensure";
import { getRuntimeEnv } from "../../../../db/runtime";
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await context.params; const itemId = Number(id); if (!Number.isInteger(itemId)) return Response.json({ error: "Ugyldig vare" }, { status: 400 });
  const db = getDb(); const [item] = await db.select().from(freezerItems).where(eq(freezerItems.id, itemId)).limit(1); if (!item) return Response.json({ error: "Fant ikke varen" }, { status: 404 });
  await db.delete(freezerItems).where(eq(freezerItems.id, itemId)); if (item.imageKey) await getRuntimeEnv().BUCKET.delete(item.imageKey); return Response.json({ ok: true });
}
