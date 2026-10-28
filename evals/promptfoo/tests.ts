/** Turns evals/dataset.jsonl into promptfoo test cases. */
import { loadDataset } from '../dataset.ts';

export default function generateTests() {
  return loadDataset().map((row) => ({
    description: `${row.id}: ${row.input}`,
    vars: { input: row.input, expected: row.expected },
    metadata: { id: row.id, tags: row.tags.join(',') },
    assert: [{ type: 'javascript', value: 'file://evals/promptfoo/assert.ts', metric: 'accuracy' }],
  }));
}
