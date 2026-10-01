export const km = (n: number) => Math.round(n).toLocaleString("en-US");

export const shortDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export const money = (n: number, currency: string) => `${currency} ${Math.round(n).toLocaleString("en-US")}`;
