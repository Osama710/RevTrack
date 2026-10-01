"use client";

import ErrorFallback from "@/components/ErrorFallback";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback reset={reset} title="This screen hit a problem" />;
}
