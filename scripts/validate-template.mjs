// Validate the bootstrap contract before publishing either output directory.
export function validateTemplate(html, { generated = false } = {}) {
  const requireOne = (pattern, label) => {
    if ([...html.matchAll(pattern)].length !== 1) throw new Error('Invalid portfolio document: expected one ' + label);
  };
  requireOne(/<x-dc\s*>/g, 'root component');
  requireOne(/<\/x-dc\s*>/g, 'root component closing tag');
  requireOne(/<script\b[^>]*\bdata-dc-script(?:\s|=|>)/g, 'controller script');
  if (!/<\/body>\s*<\/html>\s*$/i.test(html)) throw new Error('Invalid portfolio document: missing document closing tags');
  const component = html.match(/<x-dc\s*>([\s\S]*?)<\/x-dc\s*>/)[1];
  const stack = [];
  for (const tag of component.matchAll(/<(\/)?(sc-if|sc-for)\b[^>]*>/g)) {
    if (!tag[1]) stack.push(tag[2]);
    else if (stack.pop() !== tag[2]) throw new Error('Invalid portfolio document: mismatched ' + tag[2]);
  }
  if (stack.length) throw new Error('Invalid portfolio document: unclosed conditional or loop');
  const logic = html.match(/<script\b[^>]*\bdata-dc-script(?:\s[^>]*|=[^>]*|)>([\s\S]*?)<\/script>/)?.[1];
  if (!logic) throw new Error('Invalid portfolio document: controller script has no contents');
  if (generated) {
    if (!/class Component extends DCLogic/.test(logic) || !/Portfolio\.install\(Component\)/.test(logic) || html.includes('/*__APP_LOGIC__*/')) {
      throw new Error('Invalid portfolio document: controller was not embedded');
    }
  } else {
    requireOne(/\/\*__APP_LOGIC__\*\//g, 'controller insertion marker');
    if (!logic.includes('/*__APP_LOGIC__*/')) throw new Error('Invalid portfolio document: controller marker is outside its script');
  }
}
