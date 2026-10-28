import type { Agent } from '@mastra/core/agent';
import { ConversionOutputSchema, toLines, type ConversionOutput, type RecipeInput } from '../schema.ts';
import type { TokenUsage } from '../models.ts';

export interface ToolCallTrace {
  toolName: string;
  args: unknown;
  result: unknown;
}

export interface ConversionRun {
  output: ConversionOutput;
  usage: TokenUsage;
  latencyMs: number;
  steps: number;
  toolCalls: ToolCallTrace[];
}

export function buildPrompt(input: RecipeInput): string {
  const lines = toLines(input);
  return `Convert these recipe lines to US units:\n${lines.map((line, i) => `${i + 1}. ${line}`).join('\n')}`;
}

/** Runs one conversion and captures what an eval needs: output, tokens, time, tool trace. */
export async function convertRecipe(agent: Agent, input: RecipeInput): Promise<ConversionRun> {
  const started = performance.now();
  const response = await agent.generate(buildPrompt(input), {
    structuredOutput: { schema: ConversionOutputSchema },
    maxSteps: 10,
  });
  const latencyMs = performance.now() - started;
  return {
    output: response.object,
    usage: {
      inputTokens: response.usage.inputTokens ?? 0,
      outputTokens: response.usage.outputTokens ?? 0,
    },
    latencyMs,
    steps: response.steps.length,
    toolCalls: response.toolResults.map((call) => ({
      toolName: call.payload.toolName,
      args: call.payload.args,
      result: call.payload.result,
    })),
  };
}
