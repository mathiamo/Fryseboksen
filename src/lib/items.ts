import { supabase } from "./supabase";
import { optimizeImage } from "./images";

export type FreezerItem = {
  id: string;
  name: string;
  frozenOn: string;
  useWithinDays: number;
  quantity: number;
  category: string;
  comment: string;
  imagePath: string | null;
  imageUrl?: string | null;
  createdAt: string;
};

type ItemRow = {
  id: string;
  name: string;
  frozen_on: string;
  use_within_days: number;
  quantity: number;
  category: string;
  comment: string | null;
  image_path: string | null;
  created_at: string;
};

async function withImageUrl(row: ItemRow): Promise<FreezerItem> {
  let imageUrl: string | null = null;
  if (row.image_path) {
    const { data } = await supabase.storage.from("freezer-images").createSignedUrl(row.image_path, 3600);
    imageUrl = data?.signedUrl ?? null;
  }
  return {
    id: row.id,
    name: row.name,
    frozenOn: row.frozen_on,
    useWithinDays: row.use_within_days,
    quantity: row.quantity,
    category: row.category,
    comment: row.comment ?? "",
    imagePath: row.image_path,
    imageUrl,
    createdAt: row.created_at,
  };
}

export async function listItems() {
  const { data, error } = await supabase.from("freezer_items").select("*").order("frozen_on", { ascending: false });
  if (error) throw error;
  return Promise.all((data as ItemRow[]).map(withImageUrl));
}

export async function createItem(form: FormData, userId: string) {
  const selectedImage = form.get("image");
  let imagePath: string | null = null;
  if (selectedImage instanceof File && selectedImage.size) {
    if (selectedImage.size > 15_000_000) {
      throw new Error("Velg et JPG-, PNG- eller WebP-bilde under 15 MB");
    }
    const image = await optimizeImage(selectedImage);
    imagePath = `${userId}/${crypto.randomUUID()}.webp`;
    const upload = await supabase.storage.from("freezer-images").upload(imagePath, image, { contentType: "image/webp" });
    if (upload.error) throw upload.error;
  }

  const row = {
    user_id: userId,
    name: String(form.get("name") || "").trim(),
    frozen_on: String(form.get("frozenOn") || ""),
    quantity: Math.min(99, Math.max(1, Number(form.get("quantity") || 1))),
    use_within_days: Number(form.get("useWithinDays") || 90),
    category: String(form.get("category") || "Other"),
    comment: String(form.get("comment") || "").trim() || null,
    image_path: imagePath,
  };
  const { data, error } = await supabase.from("freezer_items").insert(row).select().single();
  if (error) {
    if (imagePath) await supabase.storage.from("freezer-images").remove([imagePath]);
    throw error;
  }
  return withImageUrl(data as ItemRow);
}

export async function updateItem(form: FormData, item: FreezerItem, userId: string) {
  const selectedImage = form.get("image");
  let imagePath = item.imagePath;
  let uploadedImagePath: string | null = null;

  if (selectedImage instanceof File && selectedImage.size) {
    if (selectedImage.size > 15_000_000) {
      throw new Error("Velg et JPG-, PNG- eller WebP-bilde under 15 MB");
    }
    const image = await optimizeImage(selectedImage);
    uploadedImagePath = `${userId}/${crypto.randomUUID()}.webp`;
    const upload = await supabase.storage.from("freezer-images").upload(uploadedImagePath, image, { contentType: "image/webp" });
    if (upload.error) throw upload.error;
    imagePath = uploadedImagePath;
  }

  const row = {
    name: String(form.get("name") || "").trim(),
    frozen_on: String(form.get("frozenOn") || ""),
    quantity: Math.min(99, Math.max(1, Number(form.get("quantity") || 1))),
    use_within_days: Number(form.get("useWithinDays") || 90),
    category: String(form.get("category") || "Other"),
    comment: String(form.get("comment") || "").trim() || null,
    image_path: imagePath,
  };
  const { data, error } = await supabase.from("freezer_items").update(row).eq("id", item.id).select().single();
  if (error) {
    if (uploadedImagePath) await supabase.storage.from("freezer-images").remove([uploadedImagePath]);
    throw error;
  }
  if (uploadedImagePath && item.imagePath) {
    await supabase.storage.from("freezer-images").remove([item.imagePath]);
  }
  return withImageUrl(data as ItemRow);
}

export async function deleteItem(item: FreezerItem) {
  const { error } = await supabase.from("freezer_items").delete().eq("id", item.id);
  if (error) throw error;
  if (item.imagePath) await supabase.storage.from("freezer-images").remove([item.imagePath]);
}
