import { supabase } from "./supabase";
import { optimizeImage } from "./images";

const IMAGE_BUCKET = "freezer-images";
const MAX_UPLOAD_BYTES = 15_000_000;

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
    const { data } = await supabase.storage
      .from(IMAGE_BUCKET)
      .createSignedUrl(row.image_path, 3600);
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
  const { data, error } = await supabase
    .from("freezer_items")
    .select("*")
    .order("frozen_on", { ascending: false });

  if (error) {
    throw error;
  }

  return Promise.all((data as ItemRow[]).map(withImageUrl));
}

export async function createItem(form: FormData, userId: string) {
  const imagePath = await uploadSelectedImage(form, userId);
  const row = {
    user_id: userId,
    ...itemValues(form),
    image_path: imagePath,
  };

  const { data, error } = await supabase
    .from("freezer_items")
    .insert(row)
    .select()
    .single();

  if (error) {
    if (imagePath) {
      await removeImage(imagePath);
    }
    throw error;
  }

  return withImageUrl(data as ItemRow);
}

export async function updateItem(form: FormData, item: FreezerItem, userId: string) {
  const uploadedImagePath = await uploadSelectedImage(form, userId);
  const row = {
    ...itemValues(form),
    image_path: uploadedImagePath ?? item.imagePath,
  };

  const { data, error } = await supabase
    .from("freezer_items")
    .update(row)
    .eq("id", item.id)
    .select()
    .single();

  if (error) {
    if (uploadedImagePath) {
      await removeImage(uploadedImagePath);
    }
    throw error;
  }

  if (uploadedImagePath && item.imagePath) {
    await removeImage(item.imagePath);
  }

  return withImageUrl(data as ItemRow);
}

export async function deleteItem(item: FreezerItem) {
  const { error } = await supabase.from("freezer_items").delete().eq("id", item.id);

  if (error) {
    throw error;
  }
  if (item.imagePath) {
    await removeImage(item.imagePath);
  }
}

function itemValues(form: FormData) {
  return {
    name: String(form.get("name") ?? "").trim(),
    frozen_on: String(form.get("frozenOn") ?? ""),
    quantity: Math.min(99, Math.max(1, Number(form.get("quantity") ?? 1))),
    use_within_days: Number(form.get("useWithinDays") ?? 90),
    category: String(form.get("category") ?? "Other"),
    comment: String(form.get("comment") ?? "").trim() || null,
  };
}

async function uploadSelectedImage(form: FormData, userId: string) {
  const selectedImage = form.get("image");

  if (!(selectedImage instanceof File) || selectedImage.size === 0) {
    return null;
  }
  if (selectedImage.size > MAX_UPLOAD_BYTES) {
    throw new Error("Velg et JPG-, PNG- eller WebP-bilde under 15 MB");
  }

  const image = await optimizeImage(selectedImage);
  const imagePath = `${userId}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(imagePath, image, { contentType: "image/webp" });

  if (error) {
    throw error;
  }

  return imagePath;
}

async function removeImage(imagePath: string) {
  await supabase.storage.from(IMAGE_BUCKET).remove([imagePath]);
}
