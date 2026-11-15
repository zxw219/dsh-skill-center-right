import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import { fileURLToPath } from 'node:url';
import './build.mjs';

process.chdir(fileURLToPath(new URL('.', import.meta.url)));
const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
const client = readFileSync('lib/client.js', 'utf8');
let entry;
// Contract check only: no DOM, React rendering or claimed visual verification.
new Script(client).runInNewContext({ window: { __ModuleLoader__: { load(value) { entry = value; } } } });
assert.equal(entry.id, manifest.name);
const api = entry.factory(() => ({}));
assert.deepEqual(Array.from(api.inject), ['slots', 'locale', 'sidebarRightTabs']);
assert(!client.includes('reportDailyHeartbeat'));
assert(!client.includes('name: "main"'));
assert(!client.includes('name: "sidebar.panellist"'));

function context(fail = false) {
  const events = [], cleanup = [];
  const ctx = {
    effect(fn) { const dispose = fn(); if (dispose) cleanup.push(dispose); },
    locale: { register() { return () => events.push('locale disposed'); }, bind() { return key => key; } },
    slots: {
      inject(name, fn) { assert.equal(name, 'sidebar.right.pane.tab'); return fn(); },
      register(options, body) {
        assert.equal(options.key, manifest.name);
        assert.equal(typeof body, 'function');
        events.push('body registered');
        return () => events.push('body disposed');
      }
    },
    sidebarRightTabs: { register(definition) {
      if (fail) throw new Error('registration failed');
      assert.equal(definition.id, manifest.name);
      assert.equal(definition.kind, 'skill-center');
      assert.equal(definition.keepMounted, true);
      assert.equal(definition.guide[0].title(), 'entry.label');
      events.push('type registered');
      return () => events.push('type disposed');
    } }
  };
  return { ctx, events, dispose() { for (const fn of cleanup.reverse()) fn(); } };
}
const ok = context();
api.apply(ok.ctx);
ok.dispose();
assert.deepEqual(ok.events, ['body registered', 'type registered', 'type disposed', 'body disposed', 'locale disposed']);
const failed = context(true);
assert.throws(() => api.apply(failed.ctx), /registration failed/);
assert(failed.events.includes('body disposed'), 'Partial registration leaked');
failed.dispose();
for (const language of ['zh', 'en']) {
  const { meta } = JSON.parse(readFileSync(`locale/${language}.json`, 'utf8'));
  assert(meta.title && meta.description);
}
assert.match(readFileSync('cordis.patch.yml', 'utf8'), /id: ui-skill-explorer\s+disabled: true/);
console.log('PASS: manifest, syntax, native tab registration, teardown and failed-registration cleanup.');
