import type { Source } from "@/lib/api";

export default function SourceList({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return <ol aria-label="Sources for this answer" className="mt-3 space-y-2">
    {sources.map((source, index) => <li key={source.id} className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-xs text-slate-300">
      <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-cyan-200 underline underline-offset-4">
        [{index + 1}] {source.organisation}: {source.title}
      </a>
      <p className="mt-1">{source.section} · Checked {source.verified_on}</p>
      <p className="mt-2 leading-relaxed">{source.snippet}</p>
    </li>)}
  </ol>;
}
