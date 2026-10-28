import { describe, expect, it } from 'vitest';
import { estimateCostUsd, hasModelCredentials, resolveModel } from './models.ts';

describe('resolveModel', () => {
  it('prefers OpenRouter when its key is set', () => {
    expect(resolveModel('cheap', { OPENROUTER_API_KEY: 'x', ANTHROPIC_API_KEY: 'y' })).toBe(
      'openrouter/anthropic/claude-haiku-5.5',
    );
  });

  it('falls back to Anthropic ids', () => {
    expect(resolveModel('strong', { ANTHROPIC_API_KEY: 'y' })).toBe('anthropic/claude-sonnet-5-5');
  });

  it('honours overrides and full ids', () => {
    expect(resolveModel('cheap', { MODEL_CHEAP: 'openrouter/x/y' })).toBe('openrouter/x/y');
    expect(resolveModel('anthropic/claude-opus-5-5', {})).toBe('anthropic/claude-opus-5-5');
  });

  it('rejects unknown tiers', () => {
    expect(() => resolveModel('medium', {})).toThrow();
  });
});

describe('hasModelCredentials', () => {
  it('is false with no keys', () => {
    expect(hasModelCredentials({})).toBe(false);
  });

  it('ignores an empty key left over from .env.example', () => {
    expect(hasModelCredentials({ OPENROUTER_API_KEY: '', ANTHROPIC_API_KEY: 'y' })).toBe(true);
    expect(resolveModel('cheap', { OPENROUTER_API_KEY: '', ANTHROPIC_API_KEY: 'y' })).toMatch(/^anthropic\//);
  });
});

describe('estimateCostUsd', () => {
  it('prices known models', () => {
    expect(estimateCostUsd('anthropic/claude-haiku-5-5', { inputTokens: 1_000_000, outputTokens: 1_000_000 })).toBeCloseTo(0.6);
  });

  it('returns null for unknown models', () => {
    expect(estimateCostUsd('openrouter/x/y', { inputTokens: 1, outputTokens: 1 })).toBeNull();
  });
});
