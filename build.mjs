import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('.', import.meta.url)));
const upstream = readFileSync('vendor/client-0.4.18.js', 'utf8');
const start = upstream.indexOf('\t\t//#region src/client/native-panel.tsx');
const end = upstream.indexOf('\t\texports.apply = apply;', start);
assert(start > 0 && end > start, 'Upstream native-panel/index boundaries changed');
let client = upstream.slice(0, start) + readFileSync('src/sidebar.js', 'utf8') + '\n' + upstream.slice(end);
client = client.replaceAll('@linxin666/dsh-client-ui-skill-explorer', 'dsh-skill-center-right');
client = client.replace(/^\/\/# sourceMappingURL=.*$/m, '');
const css = /const css = ("(?:[^"\\]|\\.)*");/;
assert(css.test(client), 'Upstream CSS boundary changed');
client = client.replace(css, (_, value) => `const css = ${JSON.stringify(JSON.parse(value) + '\n' + readFileSync('src/sidebar.css', 'utf8'))};`);
mkdirSync('lib', { recursive: true });
writeFileSync('lib/client.js', client.trimEnd() + '\n');
console.log('Built native right-sidebar client (upstream host unchanged).');
