import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const SECRET = process.env.ADMIN_TOKEN_SECRET ?? (() => {
  const s = randomBytes(32).toString("hex");
  console.warn("[admin-token] ADMIN_TOKEN_SECRET not set; using ephemeral secret (tokens invalidated on restart)");
  return s;
})();

const TOKEN_TTL_MS = 60 * 60 * 1000;

export function issueAdminToken(wallet: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${wallet.toLowerCase()}:${exp}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyAdminToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null;
    const parts = payload.split(":");
    const exp = Number(parts[parts.length - 1]);
    if (Date.now() > exp) return null;
    return parts.slice(0, -1).join(":");
  } catch {
    return null;
  }
}
