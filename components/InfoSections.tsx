import Link from "next/link";
import { GITHUB_REPO_URL } from "@/lib/constants";
import { GithubIcon, HeartIcon } from "./icons";

export function InfoSections() {
  return (
    <div className="space-y-3 border-t border-black/10 p-4 text-xs dark:border-white/10">
      <Link
        href="/how-it-works"
        className="block text-[var(--accent-primary)]"
      >
        How MyGPT works, its limits & contributing →
      </Link>
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <GithubIcon className="h-3.5 w-3.5" />
        Source on GitHub
      </a>
      <p className="flex items-center gap-1.5 pt-1 text-[var(--muted)]">
        <span>Made with</span>
        <HeartIcon className="h-3 w-3 text-[var(--accent-bad)]" />
        <span>in India</span>
      </p>
      <p className="text-[var(--muted)]">
        © {new Date().getFullYear()} Ekya Tech. All rights reserved.
      </p>
    </div>
  );
}
