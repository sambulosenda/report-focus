export const MAX_UPLOAD_REQUEST_BYTES = 9 * 1024 * 1024;

/** Bound multipart buffering even when a client omits Content-Length. */
export async function readUploadBody(request: Request): Promise<Uint8Array | null> {
  if (Number(request.headers.get("content-length")) > MAX_UPLOAD_REQUEST_BYTES) return null;
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_UPLOAD_REQUEST_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body;
}
