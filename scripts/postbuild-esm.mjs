// Mark the ESM build output (build/esm) as ES modules. The package root is
// "type":"commonjs" (for the CJS build in build/), so without this marker Node and
// bundlers (webpack/Turbopack) load build/esm/*.js as CommonJS and choke on the
// ESM import/export syntax. Runs from the package root after the esm tsc build.
import { writeFileSync } from 'node:fs';

writeFileSync('build/esm/package.json', JSON.stringify({ type: 'module' }, null, 2) + '\n');
