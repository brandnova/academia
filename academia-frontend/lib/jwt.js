export function decodeJwtExp(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    return decoded.exp; // seconds since epoch
  } catch {
    return null;
  }
}