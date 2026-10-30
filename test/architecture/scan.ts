import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Absolute paths of the .ts files under `dir`, spec files excluded. */
export function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'))
    .map((file) => join(dir, file));
}

/** Every module specifier the file imports (static, type and side-effect imports). */
export function importSpecifiers(file: string): string[] {
  const source = readFileSync(file, 'utf8');
  return [...source.matchAll(/(?:from|import)\s+['"]([^'"]+)['"]/g)].map(
    ([, specifier = '']) => specifier,
  );
}
