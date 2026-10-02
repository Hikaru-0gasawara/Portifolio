import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { validateTemplate } from '../scripts/validate-template.mjs';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const source = read('src/template.html');

test('source and both published documents contain the complete application bootstrap', () => {
  validateTemplate(source);
  for (const file of ['index.html', 'dist/index.html']) {
    const html = read(file);
    validateTemplate(html, { generated: true });
    const logic = html.match(/<script\b[^>]*data-dc-script[^>]*>([\s\S]*?)<\/script>/)[1];
    new vm.Script(logic);
    const context = { DCLogic: class {}, Portfolio: { install(Component) { this.component = Component; } } };
    vm.runInNewContext(logic, context);
    assert.equal(typeof context.Portfolio.component, 'function', file + ': controller must register');
  }
});

test('build validation rejects truncation, missing initialization and broken conditionals', () => {
  const endOfShooter = source.indexOf('<sc-if value="{{debug}}"');
  assert.ok(endOfShooter > 0);
  assert.throws(() => validateTemplate(source.slice(0, endOfShooter)), /Invalid portfolio document/);
  assert.throws(() => validateTemplate(source.replace('/*__APP_LOGIC__*/', '')), /controller/);
  assert.throws(() => validateTemplate(source.replace('</x-dc>', '')), /root component closing/);
  assert.throws(() => validateTemplate(source.replace('</sc-if>', '</sc-for>')), /mismatched/);
  assert.throws(() => validateTemplate(source.replace('</body></html>', '')), /closing tags/);
  assert.throws(() => validateTemplate(source, { generated: true }), /not embedded/);
});

test('the raw template never hands template expressions to attributes the browser fetches or validates',()=>{
  // Before the runtime starts, the browser parses <x-dc> as real HTML: src="{{…}}" would request a bogus URL
  // and d="{{…}}" would log SVG errors. These attributes use the runtime's sc-camel- prefix instead.
  const component=source.match(/<x-dc\s*>([\s\S]*?)<\/x-dc\s*>/)[1];
  const raw=[...component.matchAll(/\s(src|srcset|data|poster|d|transform|x|y|x1|y1|x2|y2|cx|cy|r|rx|ry|points|width|height|fill|stroke|opacity)="[^"]*\{\{/g)].map(m=>m[0].trim());
  assert.deepEqual(raw,[]);
});
