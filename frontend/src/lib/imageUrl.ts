/**
 * Convert relative image path to absolute URL
 * Backend returns: /static/uploads/image.png
 * We need: http://localhost:8000/static/uploads/image.png
 */
export function getAbsoluteImageUrl(path: string | null | undefined): string {
  if (!path) {
    return "/placeholder-product.svg";
  }

  // Already absolute URL
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Use NEXT_PUBLIC_BACKEND_URL if available, otherwise derive from API_URL
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(
      "/api/v1",
      "",
    );

  return `${backendUrl}${path}`;
}
