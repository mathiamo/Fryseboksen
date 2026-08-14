const MAX_IMAGE_EDGE = 1600;
const WEBP_QUALITY = 0.82;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type LoadedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
};

export async function optimizeImage(file: File): Promise<File> {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Velg et JPG-, PNG- eller WebP-bilde");
  }

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    image.cleanup();
    throw new Error("Kunne ikke behandle bildet");
  }

  context.drawImage(image.source, 0, 0, width, height);
  image.cleanup();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY);
  });

  if (!blob) {
    throw new Error("Kunne ikke komprimere bildet");
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "frysevare";
  return new File([blob], `${baseName}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

async function loadImage(file: File): Promise<LoadedImage> {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Some mobile browsers expose createImageBitmap but reject photos or orientation options.
    }
  }

  const url = URL.createObjectURL(file);
  const element = new Image();
  element.decoding = "async";
  element.src = url;
  await element.decode();

  return {
    source: element,
    width: element.naturalWidth,
    height: element.naturalHeight,
    cleanup: () => URL.revokeObjectURL(url),
  };
}
