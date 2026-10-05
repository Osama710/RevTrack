import "server-only";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** Shown in chat when the model chain fails — no vendor or stack details. */
export const USTAD_OFFLINE_MSG = "Ustad is in the workshop, try again in a minute.";

const SYSTEM = `Aap "AI Ustad" hain: Karachi ke mausam, traffic, tooti sadkon aur local petrol ki quality ko samajhne wala tajurbakar mechanic.
Jawab Roman-Urdu mein dein. Agar user Urdu script ya English mein likhe to usi zubaan mein jawab dein.
Jawab chhota aur amli rakhein: pehle sabse mumkin wajah, phir 3 se 5 aasan checks jo user khud kar sakta hai, phir batayein ke mechanic ko kab dikhana zaroori hai.
Safety pehle: agar brake, steering, dhuan, aag ki boo ya overheating ka khatra ho to gaari fauran rok kar band karne ka mashwara dein.
Kabhi pakka diagnosis ka daawa na karein.`;

export class AiUnavailable extends Error {}

const MODEL_CHAIN = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.5-flash"];

const LEGACY_MODEL: Record<string, string> = {
  "gemini-2.0-flash": "gemini-3.5-flash",
  "gemini-2.5-flash": "gemini-3.5-flash",
  "gemini-2.5-flash-lite": "gemini-3.5-flash-lite",
  "gemini-3.8-flash": "gemini-3.5-flash",
  "gemini-1.5-flash": "gemini-3.5-flash-lite",
  "gemini-1.5-flash-8b": "gemini-3.5-flash-lite",
  "gemini-1.5-pro": "gemini-3.5-flash",
};

function resolveModel(name: string): string {
  return LEGACY_MODEL[name] ?? name;
}

function modelsToTry(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const list = preferred ? [resolveModel(preferred), ...MODEL_CHAIN] : MODEL_CHAIN;
  return [...new Set(list.filter(Boolean))];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeHistory(history: ChatTurn[]): ChatTurn[] {
  const out: ChatTurn[] = [];
  for (const turn of history) {
    const content = turn.content.trim();
    if (!content) continue;
    if (out.length === 0 && turn.role !== "user") continue;
    const last = out[out.length - 1];
    if (last?.role === turn.role) {
      out[out.length - 1] = { role: turn.role, content: `${last.content}\n${content}` };
    } else {
      out.push({ role: turn.role, content });
    }
  }
  return out.slice(-10);
}

function generationConfig(model: string) {
  const base = { temperature: 0.45, maxOutputTokens: 900 };
  if (/gemini-3/i.test(model)) {
    return { ...base, thinkingConfig: { thinkingBudget: 0 } };
  }
  return base;
}

async function callGeminiOnce(
  apiVersion: "v1beta" | "v1",
  model: string,
  system: string,
  history: ChatTurn[],
  message: string,
  key: string,
) {
  const contents = [
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  return fetch(`https://generativelanguage.googleapis.com/${apiVersion}/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: generationConfig(model),
    }),
    signal: AbortSignal.timeout(28_000),
    cache: "no-store",
  });
}

async function callGemini(model: string, system: string, history: ChatTurn[], message: string, key: string) {
  const v1beta = await callGeminiOnce("v1beta", model, system, history, message, key);
  if (v1beta.status !== 404) return v1beta;
  return callGeminiOnce("v1", model, system, history, message, key);
}

/** One retry after ~1s on 503 or 429, then move to the next model. */
async function callModelWithBackoff(
  model: string,
  system: string,
  history: ChatTurn[],
  message: string,
  key: string,
) {
  let res = await callGemini(model, system, history, message, key);
  if (res.status === 503 || res.status === 429) {
    await sleep(1000);
    res = await callGemini(model, system, history, message, key);
  }
  return res;
}

function extractText(data: unknown): string {
  const d = data as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return d.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";
}

function shouldTryNextModel(status: number): boolean {
  return status === 400 || status === 404 || status === 429 || status === 500 || status === 502 || status === 503;
}

export async function askUstad(opts: { history: ChatTurn[]; message: string; vehicleContext?: string }): Promise<string> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    console.error("[ai/ustad] GEMINI_API_KEY is missing");
    throw new AiUnavailable(USTAD_OFFLINE_MSG);
  }

  const history = normalizeHistory(opts.history);
  const system = opts.vehicleContext ? `${SYSTEM}\n\nGaari ki maloomat:\n${opts.vehicleContext}` : SYSTEM;
  const tried: string[] = [];

  for (const model of modelsToTry()) {
    const res = await callModelWithBackoff(model, system, history, opts.message, key);

    if (res.ok) {
      const text = extractText(await res.json());
      if (text) return text;
      tried.push(`${model}: empty reply`);
      continue;
    }

    let hint = res.statusText;
    try {
      const err = (await res.json()) as { error?: { message?: string } };
      hint = err.error?.message ?? hint;
    } catch {
      /* keep statusText */
    }
    tried.push(`${model}: ${hint}`);

    if (res.status === 401 || res.status === 403) break;
    if (shouldTryNextModel(res.status)) continue;
    break;
  }

  console.error("[ai/ustad] all models failed:", tried.join(" | "));
  throw new AiUnavailable(USTAD_OFFLINE_MSG);
}
