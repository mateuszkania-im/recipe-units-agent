## Overall

| Variant | Model | Accuracy | Tune | Test | Quantity | Unit | Ingredient | Cost (total) | Cost /100 | p50 latency | p95 latency | Tool calls/case | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| baseline | anthropic/claude-haiku-5-5 | 96.7% | 97.5% (n=40) | 95.0% (n=20) | 96.7% | 100.0% | 100.0% | $0.0197 | $0.0328 | 2419 ms | 3456 ms | 0.0 | 0 |
| tools | anthropic/claude-haiku-5-5 | 76.7% | 77.5% (n=40) | 75.0% (n=20) | 76.7% | 78.3% | 98.3% | $0.0450 | $0.0751 | 3294 ms | 6755 ms | 0.9 | 0 |
| tools-policy | anthropic/claude-haiku-5-5 | 98.3% | 100.0% (n=40) | 95.0% (n=20) | 100.0% | 100.0% | 98.3% | $0.0465 | $0.0775 | 3271 ms | 4518 ms | 0.8 | 0 |
| tools-density | anthropic/claude-haiku-5-5 | 100.0% | 100.0% (n=40) | 100.0% (n=20) | 100.0% | 100.0% | 100.0% | $0.0487 | $0.0812 | 2966 ms | 4144 ms | 0.9 | 0 |
| few-shot | anthropic/claude-haiku-5-5 | 100.0% | 100.0% (n=40) | 100.0% (n=20) | 100.0% | 100.0% | 100.0% | $0.0554 | $0.0923 | 2918 ms | 4219 ms | 0.9 | 0 |

## Accuracy by tag

| Variant | Model | ambiguous | density | fraction | length | mass | no-conversion | range | temperature | volume |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| baseline | anthropic/claude-haiku-5-5 | 100.0% | 94.4% | 96.2% | 100.0% | 97.2% | 100.0% | 100.0% | 100.0% | 90.9% |
| tools | anthropic/claude-haiku-5-5 | 90.9% | 22.2% | 73.1% | 100.0% | 61.1% | 100.0% | 75.0% | 100.0% | 100.0% |
| tools-policy | anthropic/claude-haiku-5-5 | 100.0% | 94.4% | 96.2% | 100.0% | 97.2% | 100.0% | 100.0% | 100.0% | 100.0% |
| tools-density | anthropic/claude-haiku-5-5 | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% |
| few-shot | anthropic/claude-haiku-5-5 | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% |
