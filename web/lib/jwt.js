// Reads the exp claim of a JWT without verifying it. Uses atob and
// TextDecoder, which exist in both the Node and Edge runtimes, instead of
// Buffer, which is Node only.
export function decodeJwtExp(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const decoded = JSON.parse(new TextDecoder().decode(bytes));
    return decoded.exp; // seconds since epoch
  } catch {
    return null;
  }
}