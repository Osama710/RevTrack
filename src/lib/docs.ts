import type { DocType } from "@/types/db";

export const DOC_TYPES: DocType[] = ["driving_license", "registration", "token_tax", "cplc", "insurance", "fitness", "other"];

export const DOC_LABELS: Record<DocType, string> = {
  driving_license: "Driving licence",
  registration: "Vehicle registration",
  token_tax: "Token tax",
  cplc: "CPLC clearance",
  insurance: "Insurance",
  fitness: "Fitness certificate",
  other: "Other paper",
};

/** Whole days from today until a YYYY-MM-DD date. Negative once it has passed. */
export function daysUntil(date: string, now = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((new Date(`${date}T00:00:00`).getTime() - today) / 86_400_000);
}
