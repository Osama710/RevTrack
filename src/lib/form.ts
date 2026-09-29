import { redirect } from "next/navigation";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Reads and validates FormData. On bad input it redirects back to `back` with ?error=... */
export function reader(fd: FormData, back: string) {
  const fail = (msg: string): never =>
    redirect(`${back}${back.includes("?") ? "&" : "?"}error=${encodeURIComponent(msg)}`);
  const raw = (key: string) => String(fd.get(key) ?? "").trim();

  function text(key: string, label: string, max: number): string {
    const v = raw(key);
    if (!v) return fail(`${label} is required.`);
    if (v.length > max) return fail(`${label} is too long.`);
    return v;
  }
  function optText(key: string, label: string, max: number): string | null {
    const v = raw(key);
    if (!v) return null;
    if (v.length > max) return fail(`${label} is too long.`);
    return v;
  }
  function int(key: string, label: string, min = 0, max = 10_000_000): number {
    const v = raw(key);
    if (!v) return fail(`${label} is required.`);
    const n = Number(v);
    if (!Number.isInteger(n) || n < min || n > max) return fail(`${label} must be a whole number from ${min} to ${max}.`);
    return n;
  }
  function optInt(key: string, label: string, min = 0, max = 10_000_000): number | null {
    return raw(key) ? int(key, label, min, max) : null;
  }
  function money(key: string, label: string): number {
    const v = raw(key) || "0";
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0 || n > 1e9) return fail(`${label} must be zero or more.`);
    return Math.round(n * 100) / 100;
  }
  function date(key: string, label: string): string {
    const v = raw(key);
    if (!DATE.test(v) || Number.isNaN(Date.parse(v))) return fail(`${label} needs a valid date.`);
    return v;
  }
  function optDate(key: string, label: string): string | null {
    return raw(key) ? date(key, label) : null;
  }
  function pick<T extends string>(key: string, label: string, allowed: readonly T[]): T {
    const v = raw(key) as T;
    if (!allowed.includes(v)) return fail(`Choose a valid ${label}.`);
    return v;
  }
  function uuid(key: string, label: string): string {
    const v = raw(key);
    if (!/^[0-9a-f-]{36}$/i.test(v)) return fail(`Choose a valid ${label}.`);
    return v;
  }

  return { fail, text, optText, int, optInt, money, date, optDate, pick, uuid };
}
