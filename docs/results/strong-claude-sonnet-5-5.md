## Overall

| Variant | Model | Accuracy | Tune | Test | Quantity | Unit | Ingredient | Cost (total) | Cost /100 | p50 latency | p95 latency | Tool calls/case | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| baseline | anthropic/claude-sonnet-5-5 | 91.7% | 90.0% (n=40) | 95.0% (n=20) | 91.7% | 100.0% | 100.0% | $0.3417 | $0.5696 | 2558 ms | 4111 ms | 0.0 | 0 |
| tools | anthropic/claude-sonnet-5-5 | 95.0% | 95.0% (n=40) | 95.0% (n=20) | 95.0% | 100.0% | 100.0% | $0.7772 | $1.2954 | 3185 ms | 6204 ms | 0.9 | 0 |
| tools-policy | anthropic/claude-sonnet-5-5 | 96.7% | 95.0% (n=40) | 100.0% (n=20) | 96.7% | 100.0% | 100.0% | $0.8616 | $1.4360 | 3082 ms | 5291 ms | 0.9 | 0 |
| tools-density | anthropic/claude-sonnet-5-5 | 100.0% | 100.0% (n=40) | 100.0% (n=20) | 100.0% | 100.0% | 100.0% | $0.9102 | $1.5170 | 3017 ms | 4450 ms | 0.9 | 0 |
| few-shot | anthropic/claude-sonnet-5-5 | 100.0% | 100.0% (n=40) | 100.0% (n=20) | 100.0% | 100.0% | 100.0% | $1.0449 | $1.7414 | 2918 ms | 4097 ms | 0.9 | 0 |

## Accuracy by tag

| Variant | Model | ambiguous | density | fraction | length | mass | no-conversion | range | temperature | volume |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| baseline | anthropic/claude-sonnet-5-5 | 100.0% | 88.9% | 84.6% | 100.0% | 94.4% | 100.0% | 75.0% | 100.0% | 72.7% |
| tools | anthropic/claude-sonnet-5-5 | 100.0% | 83.3% | 92.3% | 100.0% | 91.7% | 100.0% | 100.0% | 100.0% | 100.0% |
| tools-policy | anthropic/claude-sonnet-5-5 | 100.0% | 88.9% | 100.0% | 100.0% | 94.4% | 100.0% | 100.0% | 100.0% | 100.0% |
| tools-density | anthropic/claude-sonnet-5-5 | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% |
| few-shot | anthropic/claude-sonnet-5-5 | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% |
