/** Shown instantly while the next page's data loads, so taps never feel dead. */
export default function Loading() {
  return (
    <main className="page-main pt-24" aria-busy>
      <div className="cut cut-lg shimmer h-44" />
      <div className="cut shimmer mt-4 h-28" />
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="cut shimmer h-16" />
        <div className="cut shimmer h-16" />
        <div className="cut shimmer h-16" />
      </div>
    </main>
  );
}
