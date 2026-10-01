"use client";

import ErrorFallback from "@/components/ErrorFallback";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback reset={reset} />;
}
