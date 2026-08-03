import path from "path";

const INVALID_SEGMENT = /[\\/]/g;

export const safePathSegment = (value, fallback = "") => {
  const raw = String(value || "").trim();
  if (!raw) return fallback;

  const sanitized = raw
    .replace(INVALID_SEGMENT, "-")
    .replace(/\.\.+/g, "-")
    .replace(/[^a-zA-Z0-9 _.-]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  const segment = path.basename(sanitized).trim();
  return segment || fallback;
};

export const safeUploadName = (value, fallback = "file") => {
  const basename = path.basename(String(value || "").trim());
  const cleaned = basename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned || fallback;
};
