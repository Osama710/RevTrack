"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useNavLoading } from "@/components/navigation-loading";

export default function AppLink({ href, onClick, ...rest }: ComponentProps<typeof Link>) {
  const { start } = useNavLoading();
  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) start();
      }}
    />
  );
}
