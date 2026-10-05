export type ImagePreviewSize = 'thumbnail' | 'display';

/** Only authenticated, same-origin image endpoints are rewritten. */
export function imagePreviewUrl(source: string, size: ImagePreviewSize): string {
  if (!/^\/api\/(sessions\/[\w-]+\/(images\/[a-f0-9]{32}(?:\?|$)|image\?)|workspaces\/[\w-]+\/files\/content\?)/.test(source)) return source;
  const url = new URL(source, 'http://preview.invalid');
  url.searchParams.set('size', size);
  return url.pathname + url.search;
}
