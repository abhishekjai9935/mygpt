import type { Metadata } from "next";
import Link from "next/link";
import { GITHUB_REPO_URL } from "@/lib/constants";
import { GithubIcon, HeartIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "How MyGPT works — MyGPT by Ekya Tech",
  description:
    "How MyGPT's on-device AI works, what it can and can't measure, and how to contribute.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-[var(--muted)]">
        {children}
      </div>
    </section>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 py-10 sm:py-14">
      <Link
        href="/"
        className="mb-8 inline-block text-sm text-[var(--accent-primary)]"
      >
        ← Back to chat
      </Link>

      <h1 className="mb-2 text-2xl font-semibold text-[var(--foreground)]">
        How MyGPT works
      </h1>
      <p className="mb-10 text-sm text-[var(--muted)]">
        MyGPT is a privacy-first chat interface built on top of Chrome&apos;s
        on-device Prompt API. This page explains the mechanism, its honest
        limits, and where to find the source.
      </p>

      <Section title="The flow">
        <div className="rounded-xl border border-black/10 bg-[var(--panel)] p-4 text-center font-mono text-xs text-[var(--foreground)] dark:border-white/10">
          Browser JavaScript → Chrome Prompt API → local model → response
        </div>
        <p>
          Every message you send is handed directly to Chrome&apos;s built-in
          <code className="mx-1 rounded bg-black/[.06] px-1 py-0.5 font-mono text-[0.85em] dark:bg-white/[.1]">
            LanguageModel
          </code>
          API in your own browser. There is no server-side AI route in this
          app — nothing you type is ever sent anywhere.
        </p>
      </Section>

      <Section title="What this page cannot measure">
        <ul className="list-inside list-disc space-y-1.5">
          <li>Exact model file size on disk</li>
          <li>Exact RAM used by the local model</li>
          <li>Live system-wide CPU percentage</li>
        </ul>
        <p>
          These are managed entirely by Chrome and are not exposed to
          ordinary webpages. Where MyGPT shows device info (RAM, CPU
          threads), it&apos;s clearly labeled as an approximation from
          <code className="mx-1 rounded bg-black/[.06] px-1 py-0.5 font-mono text-[0.85em] dark:bg-white/[.1]">
            navigator.deviceMemory
          </code>
          and
          <code className="mx-1 rounded bg-black/[.06] px-1 py-0.5 font-mono text-[0.85em] dark:bg-white/[.1]">
            navigator.hardwareConcurrency
          </code>
          , not a live system reading.
        </p>
      </Section>

      <Section title="Session retention">
        <p>
          Chats are temporary by default and auto-clear 20 minutes after your
          last message if you don&apos;t return. Toggling on a permanent
          session saves the chat to this browser&apos;s local storage
          instead — still subject to Chrome&apos;s own storage policy, not a
          guarantee it persists forever.
        </p>
      </Section>

      <Section title="Not affiliated with OpenAI or ChatGPT">
        <p>
          MyGPT is an independent project by Ekya Tech. It is not affiliated
          with, endorsed by, or a replacement for OpenAI or ChatGPT.
        </p>
      </Section>

      <Section title="Source code & contributing">
        <p>
          MyGPT is open source. For implementation details, to report an
          issue, or to contribute, see the GitHub repository:
        </p>
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
        >
          <GithubIcon className="h-4 w-4" />
          View on GitHub
        </a>
      </Section>

      <footer className="mt-14 flex flex-col items-center gap-1.5 border-t border-black/10 pt-6 text-xs text-[var(--muted)] dark:border-white/10">
        <div className="flex items-center gap-1.5">
          <span>Made with</span>
          <HeartIcon className="h-3.5 w-3.5 text-[var(--accent-bad)]" />
          <span>in India</span>
        </div>
        <p>© {new Date().getFullYear()} Ekya Tech. All rights reserved.</p>
      </footer>
    </div>
  );
}
