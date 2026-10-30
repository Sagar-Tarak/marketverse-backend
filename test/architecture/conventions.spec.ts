import { readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importSpecifiers, sourceFiles } from './scan.js';

const ROOT = resolve(import.meta.dirname, '../..');
const SRC = resolve(ROOT, 'src');

function importsMatching(
  files: string[],
  banned: (specifier: string) => boolean,
): string[] {
  return files.flatMap((file) =>
    importSpecifiers(file)
      .filter(banned)
      .map((specifier) => `${relative(ROOT, file)} imports ${specifier}`),
  );
}

describe('conventions', () => {
  it('controllers stay thin: no Prisma, no PrismaService', () => {
    const controllers = sourceFiles(SRC).filter((file) =>
      file.endsWith('.controller.ts'),
    );
    expect(controllers.length).toBeGreaterThan(0);

    const violations = importsMatching(
      controllers,
      (specifier) =>
        specifier.startsWith('@prisma/') ||
        specifier.includes('prisma.service'),
    );
    expect(violations).toEqual([]);
  });

  it('the simulation engine is pure: no Nest, Prisma, Redis or queues', () => {
    const banned = ['@nestjs/', '@prisma/', 'bullmq', 'ioredis', 'express'];
    const files = sourceFiles(resolve(SRC, 'simulation'));

    const violations = importsMatching(files, (specifier) =>
      banned.some((prefix) => specifier.startsWith(prefix)),
    );
    expect(violations).toEqual([]);
  });

  it('prisma/ holds schema and SQL only, no TypeScript', () => {
    const tsFiles = readdirSync(resolve(ROOT, 'prisma'), {
      recursive: true,
      encoding: 'utf8',
    }).filter((file) => file.endsWith('.ts'));
    expect(tsFiles).toEqual([]);
  });
});
