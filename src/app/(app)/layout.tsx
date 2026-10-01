import AppProviders from "./AppProviders";

/** Keep layout sync; providers live in AppProviders (async) without a Suspense shell that unmounts context. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
