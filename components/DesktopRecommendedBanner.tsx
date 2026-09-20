export function DesktopRecommendedBanner({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="border-b border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/10 px-4 py-2 text-center text-xs text-[var(--accent-primary)]">
      MyGPT needs Chrome&apos;s on-device AI. Open this page in the{" "}
      <strong className="font-semibold">Chrome browser on a desktop or
      laptop</strong>{" "}
      — it isn&apos;t available on mobile, and no other browser (Safari,
      Firefox, Edge) supports it either, even on desktop.
    </div>
  );
}
