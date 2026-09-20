export default function OfflinePage() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-lg font-semibold">You&apos;re offline</h1>
      <p className="max-w-sm text-sm text-[var(--muted)]">
        This page hasn&apos;t been cached yet. Reconnect once to load MyGPT,
        and it will be available offline afterward.
      </p>
    </div>
  );
}
