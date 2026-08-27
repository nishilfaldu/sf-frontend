/** Shared photo constraints for the form, validation, and file picker. */

export const PHOTO_SUBTYPES = ["jpeg", "png", "gif", "webp"] as const;
const PHOTO_SUBTYPE_ALIASES = ["jpg"] as const;

export const PHOTO_ACCEPT = PHOTO_SUBTYPES.map((type) => `image/${type}`).join(
  ",",
);

export const PHOTO_MIME_TYPES = new Set(
  PHOTO_SUBTYPES.map((type) => `image/${type}`),
);

export const MAX_PHOTO_BYTES = 512 * 1024;
export const MAX_PHOTO_DATA_URL_CHARS = 800_000;

export const PHOTO_DATA_URL_PATTERN = new RegExp(
  `^data:image/(?:${[...PHOTO_SUBTYPES, ...PHOTO_SUBTYPE_ALIASES].join("|")});base64,[A-Za-z0-9+/=\\s]+$`,
  "i",
);

export function photoErrorForFile(file: File): string | null {
  if (!PHOTO_MIME_TYPES.has(file.type)) {
    return "Photo must be a JPEG, PNG, GIF, or WebP image";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "Photo must be 512 KB or smaller";
  }
  return null;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(reader.error ?? new Error("Could not read that file"));
    reader.readAsDataURL(file);
  });
}
