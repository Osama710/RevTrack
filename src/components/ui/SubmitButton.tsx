"use client";

import { useFormStatus } from "react-dom";
import { useEffect } from "react";
import CarLoader from "@/components/CarLoader";
import { useNavLoading } from "@/components/navigation-loading";
import { buttonClass } from "@/components/ui/form";

export default function SubmitButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  const { start } = useNavLoading();

  useEffect(() => {
    if (pending) start();
  }, [pending, start]);

  return (
    <button type="submit" disabled={pending} className={className ?? buttonClass}>
      {pending ? "Saving…" : children}
    </button>
  );
}
