import Link from "next/link";
import { GITHUB_REPO_URL } from "@/lib/constants";
import { GithubIcon, HeartIcon } from "./icons";

export function InfoSections() {
  return (
    <div className="space-y-1.5 border-t border-black/10 p-3 text-xs dark:border-white/10">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/how-it-works"
          className="text-[var(--accent-primary)] hover:underline"
        >
          How MyGPT works &amp; contribute →
        </Link>
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Source on GitHub"
          title="Source on GitHub"
          className="text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <GithubIcon className="h-4 w-4" />
        </a>
      </div>
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[var(--muted)]">
        <span className="inline-flex items-center gap-1">
          Made with <HeartIcon className="h-3 w-3 text-[var(--accent-bad)]" /> in India
        </span>
        <span>· © {new Date().getFullYear()} Ekya Tech. All rights reserved.</span>
      </p>
    </div>
  );
}
