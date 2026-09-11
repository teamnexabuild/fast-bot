#!/usr/bin/env node
/**
 * artisan — dev-only scaffolding CLI for fast-bot (Node.js, never deployed).
 *
 * Usage:
 *   node bin/artisan.js make:controller Payment
 *   node bin/artisan.js make:middleware ThrottleRequests
 *   node bin/artisan.js make:guard SubscriberGuard
 *   node bin/artisan.js make:model Order
 *   node bin/artisan.js route:list
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const TARGETS = {
  controller: { dir: 'src/controllers', stub: 'controller.stub', suffix: 'Controller' },
  middleware: { dir: 'src/middleware', stub: 'middleware.stub', suffix: '' },
  guard: { dir: 'src/guards', stub: 'guard.stub', suffix: 'Guard' },
  model: { dir: 'src/models', stub: 'model.stub', suffix: '' },
};

function toPascalCase(name) {
  return name
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

function ensureSuffix(name, suffix) {
  return suffix && !name.endsWith(suffix) ? `${name}${suffix}` : name;
}

function makeFile(kind, rawName) {
  const target = TARGETS[kind];
  if (!target) {
    console.error(`Unknown generator "make:${kind}". Try: ${Object.keys(TARGETS).map((k) => `make:${k}`).join(', ')}`);
    process.exit(1);
  }
  if (!rawName) {
    console.error(`Usage: node bin/artisan.js make:${kind} <Name>`);
    process.exit(1);
  }

  const className = ensureSuffix(toPascalCase(rawName), target.suffix);
  const stubPath = path.join(root, 'stubs', target.stub);
  const outDir = path.join(root, target.dir);
  const outPath = path.join(outDir, `${className}.js`);

  if (fs.existsSync(outPath)) {
    console.error(`Already exists: ${path.relative(root, outPath)}`);
    process.exit(1);
  }

  const bindingName = `${className.toUpperCase()}_KV`;
  const lowerName = className.charAt(0).toLowerCase() + className.slice(1);

  const contents = fs
    .readFileSync(stubPath, 'utf8')
    .replaceAll('{{className}}', className)
    .replaceAll('{{bindingName}}', bindingName)
    .replaceAll('{{lowerName}}', lowerName);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, contents);
  console.log(`Created ${path.relative(root, outPath)}`);

  if (kind === 'controller') {
    console.log(`Don't forget to register a route in src/routes/bot.js:`);
    console.log(`  router.command('name', [${className}, 'handle']);`);
  }
  if (kind === 'guard') {
    console.log(`Attach it to a route: router.command('name', handler, { guards: [${className}] });`);
  }
  if (kind === 'middleware') {
    console.log(`Register it globally with app.router.use(${className})`);
    console.log(`or per-route via { middleware: [${className}] }.`);
  }
}

async function listRoutes() {
  const { Router } = await import(path.join(root, 'src/core/Router.js'));
  const { default: registerRoutes } = await import(path.join(root, 'src/routes/bot.js'));

  const router = new Router();
  registerRoutes(router);

  console.log('Commands:');
  for (const [name, route] of router.commands) {
    console.log(`  /${name}${route.guards?.length ? '  [guarded]' : ''}`);
  }

  if (router.actionHandlers.length) {
    console.log('\nCallback actions:');
    for (const route of router.actionHandlers) {
      console.log(`  ${route.regex}`);
    }
  }

  if (router.textHandlers.length) {
    console.log('\nText fallback: registered');
  }
}

function help() {
  console.log(`fast-bot artisan

  make:controller <Name>   Create a controller in src/controllers
  make:middleware <Name>   Create a middleware in src/middleware
  make:guard <Name>        Create a guard in src/guards
  make:model <Name>        Create a KV-backed model in src/models
  route:list                List registered commands & actions
`);
}

const [, , cmd, name] = process.argv;

if (!cmd || cmd === 'help' || cmd === '--help') {
  help();
} else if (cmd === 'route:list') {
  await listRoutes();
} else if (cmd.startsWith('make:')) {
  makeFile(cmd.split(':')[1], name);
} else {
  console.error(`Unknown command "${cmd}".\n`);
  help();
  process.exit(1);
}
