import "server-only";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM = `Aap "AI Ustad" hain: Karachi ke mausam, traffic, tooti sadkon aur local petrol ki quality ko samajhne wala tajurbakar mechanic.
Jawab Roman-Urdu mein dein. Agar user Urdu script ya English mein likhe to usi zubaan mein jawab dein.
Jawab chhota aur amli rakhein: pehle sabse mumkin wajah, phir 3 se 5 aasan checks jo user khud kar sakta hai, phir batayein ke mechanic ko kab dikhana zaroori hai.
Safety pehle: agar brake, steering, dhuan, aag ki boo ya overheating ka khatra ho to gaari fauran rok kar band karne ka mashwara dein.
Kabhi pakka diagnosis ka daawa na karein.`;

export class AiUnavailable extends Error {}

const DEFAULT_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];

function modelsToTry(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const list = preferred ? [preferred, ...DEFAULT_MODELS] : DEFAULT_MODELS;
  return [...new Set(list)];
}

async function callGemini(model: string, system: string, history: ChatTurn[], message: string, key: string) {
  const contents = [
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { temperature: 0.45, maxOutputTokens: 900 },
    }),
    signal: AbortSignal.timeout(28_000),
    cache: "no-store",
  });
}

function extractText(data: unknown): string {
  const d = data as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return d.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";
}

export async function askUstad(opts: { history: ChatTurn[]; message: string; vehicleContext?: string }): Promise<string> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new AiUnavailable("AI Ustad is not configured. Add GEMINI_API_KEY to your environment.");

  const system = opts.vehicleContext ? `${SYSTEM}\n\nGaari ki maloomat:\n${opts.vehicleContext}` : SYSTEM;
  let lastStatus = 0;
  let lastHint = "";

  for (const model of modelsToTry()) {
    const res = await callGemini(model, system, opts.history, opts.message, key);
    lastStatus = res.status;

    if (res.status === 429) throw new AiUnavailable("Free AI limit reached. Try again in a minute.");
    if (res.ok) {
      const text = extractText(await res.json());
      if (text) return text;
      lastHint = "Empty response from model.";
      continue;
    }

    try {
      const err = (await res.json()) as { error?: { message?: string } };
      lastHint = err.error?.message ?? res.statusText;
    } catch {
      lastHint = res.statusText;
    }

    if (res.status === 404 || res.status === 400) continue;
    break;
  }

  if (lastStatus === 401 || lastStatus === 403) {
    throw new AiUnavailable("Invalid Gemini API key. Check GEMINI_API_KEY in your environment.");
  }

  throw new AiUnavailable(lastHint ? `Ustad unavailable: ${lastHint}` : "Ustad couldn't answer. Try again shortly.");
}
