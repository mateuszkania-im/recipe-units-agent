import type { Accuracy } from './scorers.ts';

export interface RunSummary {
  variant: string;
  model: string;
  accuracy: { overall: Accuracy; byTag: Record<string, Accuracy> };
  errors: number;
  totalCostUsd: number | null;
  latencyMs: { p50: number; p95: number };
  avgToolCalls: number;
}

export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)] ?? 0;
}

const pct = (n: number): string => `${(n * 100).toFixed(1)}%`;
const usd = (n: number | null): string => (n === null ? 'n/a' : `$${n.toFixed(4)}`);

export function toMarkdown(summaries: readonly RunSummary[]): string {
  const header = [
    '| Variant | Model | Accuracy | Quantity | Unit | Ingredient | Cost (total) | p50 latency | p95 latency | Tool calls/case | Errors |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  const rows = summaries.map((s) => {
    const o = s.accuracy.overall;
    return `| ${s.variant} | ${s.model} | ${pct(o.pass)} | ${pct(o.quantity)} | ${pct(o.unit)} | ${pct(o.ingredient)} | ${usd(s.totalCostUsd)} | ${Math.round(s.latencyMs.p50)} ms | ${Math.round(s.latencyMs.p95)} ms | ${s.avgToolCalls.toFixed(1)} | ${s.errors} |`;
  });

  const tags = [...new Set(summaries.flatMap((s) => Object.keys(s.accuracy.byTag)))].sort();
  const tagHeader = [`| Variant | Model | ${tags.join(' | ')} |`, `| --- | --- |${tags.map(() => ' --- |').join('')}`];
  const tagRows = summaries.map(
    (s) => `| ${s.variant} | ${s.model} | ${tags.map((t) => { const a = s.accuracy.byTag[t]; return a ? pct(a.pass) : '-'; }).join(' | ')} |`,
  );

  return ['## Overall', '', ...header, ...rows, '', '## Accuracy by tag', '', ...tagHeader, ...tagRows, ''].join('\n');
}
