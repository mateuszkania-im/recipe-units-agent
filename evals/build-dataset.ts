import { writeFileSync } from 'node:fs';
import { buildDataset, DATASET_PATH, serializeDataset } from './dataset.ts';

const rows = buildDataset();
writeFileSync(DATASET_PATH, serializeDataset(rows));
console.log(`Wrote ${rows.length} cases to ${DATASET_PATH}`);
