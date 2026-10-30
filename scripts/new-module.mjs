// Usage: pnpm gen:module <kebab-name>      e.g. pnpm gen:module world-clocks
// Creates the flat module skeleton described in CLAUDE.md. See src/modules/catalog for the full shape.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const name = process.argv[2];

if (!name || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
  console.error(
    'Usage: pnpm gen:module <kebab-name>   (lowercase, e.g. world-clocks)',
  );
  process.exit(1);
}

const dir = join('src', 'modules', name);
if (existsSync(dir)) {
  console.error(`${dir} already exists. Nothing written.`);
  process.exit(1);
}

const pascal = name
  .split('-')
  .map((part) => part[0].toUpperCase() + part.slice(1))
  .join('');

const files = {
  [`${name}.module.ts`]: `import { Module } from '@nestjs/common';
import { ${pascal}Controller } from './${name}.controller.js';
import { ${pascal}Service } from './${name}.service.js';

@Module({
  controllers: [${pascal}Controller],
  providers: [${pascal}Service],
  exports: [${pascal}Service],
})
export class ${pascal}Module {}
`,
  [`${name}.controller.ts`]: `import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('${name}')
@Controller('${name}')
export class ${pascal}Controller {}
`,
  [`${name}.service.ts`]: `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';

@Injectable()
export class ${pascal}Service {
  constructor(protected readonly prisma: PrismaService) {}
}
`,
  [`${name}.service.spec.ts`]: `import { describe, it } from 'vitest';

describe('${pascal}Service', () => {
  it.todo('covers the first business rule');
});
`,
};

mkdirSync(dir, { recursive: true });
for (const [file, content] of Object.entries(files)) {
  writeFileSync(join(dir, file), content);
}

console.log(`Created ${dir}/`);
for (const file of Object.keys(files)) console.log(`  ${file}`);
console.log(`
Next:
  1. src/app.module.ts: import { ${pascal}Module } from './modules/${name}/${name}.module.js' and add ${pascal}Module to imports.
  2. Add routes to the controller and logic to the service (copy the recipes in CLAUDE.md or src/modules/catalog).
  3. Request DTOs and response types go in schemas/${name}.schema.ts (create it when first needed).
  4. Check doc/module-map.md names this module and lists its tables.
  5. pnpm check`);
