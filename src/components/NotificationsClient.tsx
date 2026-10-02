"use client";

import Link from "next/link";
import { PageTop } from "@/components/nav";
import PushToggle from "@/components/PushToggle";
import type { Alert } from "@/lib/alerts";

export default function NotificationsClient({ alerts, publicKey }: { alerts: Alert[]; publicKey: string }) {
  return (
    <main className="page-main relative">
      <PageTop />
      <h1 className="h-sec mt-2">Alerts</h1>
      <p className="mb-5 text-sm text-dim">Everything that needs your attention.</p>

      {alerts.length === 0 ? (
        <p className="cut p-5 text-sm text-dim">All clear. Nothing is due or overdue.</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.key}>
              <Link
                href={a.url}
                className={`cut block px-4 py-3.5 active:scale-[0.99] ${a.severity === "urgent" ? "[--panel:rgb(255_61_110/0.08)]" : ""}`}
              >
                <span className={`text-xs font-semibold uppercase tracking-wide ${a.severity === "urgent" ? "text-redline" : "text-mint"}`}>
                  {a.severity === "urgent" ? "Urgent" : "Coming up"}
                </span>
                <span className="mt-0.5 block font-semibold">{a.title}</span>
                <span className="block text-sm text-dim">{a.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <PushToggle publicKey={publicKey} />
      </div>
    </main>
  );
}
