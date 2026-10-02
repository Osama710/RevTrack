"use client";

import Link from "next/link";
import { IconChevronBack } from "@/components/icons";
import { useNavLoading } from "@/components/navigation-loading";

export default function BackLink({ href, label = "Back" }: { href: string; label?: string }) {
  const { start } = useNavLoading();
  return (
    <Link
      href={href}
      aria-label={label}
      onClick={() => start()}
      className="inline-flex size-10 items-center justify-center text-bone active:scale-95"
    >
      <IconChevronBack className="size-6" />
    </Link>
  );
}
