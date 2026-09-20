export function OfflineBanner({ modelAvailable }: { modelAvailable: boolean }) {
  return (
    <div className="border-b border-[var(--accent-warn)]/30 bg-[var(--accent-warn)]/10 px-4 py-2 text-center text-xs text-[var(--accent-warn)]">
      You&apos;re offline.{" "}
      {modelAvailable
        ? "Local AI keeps working since the model already lives on this device."
        : "The local model hasn't finished downloading, so chat is unavailable until you're back online."}
    </div>
  );
}
