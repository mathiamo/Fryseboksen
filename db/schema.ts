import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const freezerItems = sqliteTable("freezer_items", {
  id: integer("id").primaryKey({ autoIncrement: true }), name: text("name").notNull(), frozenOn: text("frozen_on").notNull(),
  useWithinDays: integer("use_within_days").notNull().default(90), quantity: integer("quantity").notNull().default(1),
  category: text("category").notNull().default("Other"), imageKey: text("image_key"), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
