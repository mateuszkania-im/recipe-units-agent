import type { Agent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core/mastra';
import { LangfuseExporter } from '@mastra/langfuse';
import { Observability } from '@mastra/observability';

export function isLangfuseEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.LANGFUSE_PUBLIC_KEY && env.LANGFUSE_SECRET_KEY);
}

/**
 * Registers agents on a Mastra instance. Langfuse tracing is attached only
 * when LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY are set.
 */
export function createMastra(agents: Record<string, Agent>): Mastra {
  if (!isLangfuseEnabled()) return new Mastra({ agents });
  return new Mastra({
    agents,
    observability: new Observability({
      configs: {
        langfuse: {
          serviceName: 'recipe-units-agent',
          exporters: [new LangfuseExporter()],
        },
      },
    }),
  });
}
