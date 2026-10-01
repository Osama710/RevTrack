import "server-only";
import webpush from "web-push";

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

export interface StoredSub {
  endpoint: string;
  p256dh: string;
  auth: string;
}

let configured = false;

/** Returns false when the VAPID keys are missing, so callers can show a helpful message. */
export function pushConfigured(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", pub, priv);
  configured = true;
  return true;
}

export async function sendPush(sub: StoredSub, payload: PushPayload): Promise<"ok" | "gone" | "error"> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 }
    );
    return "ok";
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    return status === 404 || status === 410 ? "gone" : "error";
  }
}
