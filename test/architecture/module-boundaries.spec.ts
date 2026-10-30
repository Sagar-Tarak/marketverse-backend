import { dirname, join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importSpecifiers, sourceFiles } from './scan.js';

const SRC = resolve(import.meta.dirname, '../../src');
const MODULES = join(SRC, 'modules');

type Graph = ReadonlyMap<string, ReadonlySet<string>>;

/** First import cycle found, as `a -> b -> a`, or undefined. */
export function findCycle(graph: Graph): string | undefined {
  const done = new Set<string>();

  const visit = (node: string, path: readonly string[]): string | undefined => {
    if (path.includes(node))
      return [...path.slice(path.indexOf(node)), node].join(' -> ');
    if (done.has(node)) return undefined;
    for (const next of graph.get(node) ?? []) {
      const cycle = visit(next, [...path, node]);
      if (cycle) return cycle;
    }
    done.add(node);
    return undefined;
  };

  for (const node of graph.keys()) {
    const cycle = visit(node, []);
    if (cycle) return cycle;
  }
  return undefined;
}

function moduleOf(absolutePath: string): string | undefined {
  const [name] = relative(MODULES, absolutePath).split(sep);
  return name && name !== '..' ? name : undefined;
}

function moduleGraph(): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  for (const file of sourceFiles(MODULES)) {
    const from = moduleOf(file);
    if (!from) continue;
    const edges = graph.get(from) ?? new Set<string>();
    graph.set(from, edges);

    for (const specifier of importSpecifiers(file)) {
      if (!specifier.startsWith('.')) continue;
      const to = moduleOf(resolve(dirname(file), specifier));
      if (to && to !== from) edges.add(to);
    }
  }
  return graph;
}

describe('module imports', () => {
  it('finds the modules', () => {
    expect([...moduleGraph().keys()]).toContain('catalog');
  });

  it('have no cycles between modules', () => {
    expect(findCycle(moduleGraph())).toBeUndefined();
  });

  it('detects a cycle when there is one', () => {
    const graph = new Map([
      ['markets', new Set(['inventory'])],
      ['inventory', new Set(['finance'])],
      ['finance', new Set(['markets'])],
    ]);
    expect(findCycle(graph)).toBe('markets -> inventory -> finance -> markets');
  });
});
