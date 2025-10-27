import { describe, it, expect } from 'vitest';
import { parseCodeFromMessage } from '../lib/utils';

describe('parseCodeFromMessage', () => {
  it('parses a single mermaid block with title and description before code', () => {
    const msg = '%% title: My Diagram %%\nDescription: This is a test.\n\n```mermaid\ngraph TD\nA-->B\n```\n';
    const parsed = parseCodeFromMessage(msg);
    expect(parsed.length).toBe(1);
    expect(parsed[0].title).toBe('My Diagram');
    expect(parsed[0].description).toBe('This is a test.');
    expect(parsed[0].code).toContain('graph TD');
  });

  it('parses multiple mermaid blocks', () => {
    const msg = '%% title: One %%\nDescription: First\n```mermaid\nsequenceDiagram\nA->>B: hi\n```\n\n%% title: Two %%\nDescription: Second\n```mermaid\nclassDiagram\nClassA <|-- ClassB\n```\n';
    const parsed = parseCodeFromMessage(msg);
    expect(parsed.length).toBe(2);
    expect(parsed[0].title).toBe('One');
    expect(parsed[1].title).toBe('Two');
  });

  it('falls back to extracting code blocks when no structured metadata', () => {
    const msg = 'Here is a code block:\n```mermaid\nflowchart LR\nA-->B\n```';
    const parsed = parseCodeFromMessage(msg);
    expect(parsed.length).toBe(1);
    expect(parsed[0].code).toContain('flowchart LR');
  });

  it('handles description inside code block', () => {
    const msg = '```mermaid\nDescription: Desc inside\ngraph TD\nA-->B\n```';
    const parsed = parseCodeFromMessage(msg);
    expect(parsed.length).toBe(1);
    expect(parsed[0].description).toBe('Desc inside');
    expect(parsed[0].code).toContain('graph TD');
  });
});
