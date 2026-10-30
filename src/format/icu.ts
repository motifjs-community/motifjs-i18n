import { numberFormat, pluralRules } from './intl';
import type { Params } from '../types';

// The supported ICU subset: {name}, {n, number}, {n, plural, ...}, {x, select, ...} and '#' inside plural.
type Node =
  | string
  | { arg: string; type: 'simple' }
  | { arg: string; type: 'number' }
  | { arg: string; type: 'select'; offset: number; cases: Record<string, Node[]> }
  | { arg: string; type: 'plural'; offset: number; cases: Record<string, Node[]> }
  | { hash: true };

interface Cursor {
  i: number;
}

const cache = new Map<string, Node[]>();

/** Parses a message once; the result is cached by its source text. */
export function parse(source: string): Node[] {
  let hit = cache.get(source);
  if (!hit) cache.set(source, (hit = nodes(source, { i: 0 }, false, false)));
  return hit;
}

function nodes(s: string, p: Cursor, inPlural: boolean, nested: boolean): Node[] {
  const out: Node[] = [];
  let text = '';
  const flush = () => {
    if (text) out.push(text);
    text = '';
  };
  while (p.i < s.length) {
    const c = s[p.i];
    if (c === "'") {
      if (s[p.i + 1] === "'") {
        text += "'";
        p.i += 2;
      } else if (s[p.i + 1] === '{' || s[p.i + 1] === '}') {
        // 'text in braces' is literal
        const end = s.indexOf("'", p.i + 1);
        text += s.slice(p.i + 1, end < 0 ? s.length : end);
        p.i = end < 0 ? s.length : end + 1;
      } else {
        text += c;
        p.i++;
      }
    } else if (c === '{') {
      flush();
      out.push(argument(s, p));
    } else if (c === '}' && nested) {
      break;
    } else if (c === '#' && inPlural) {
      flush();
      out.push({ hash: true });
      p.i++;
    } else {
      text += c;
      p.i++;
    }
  }
  flush();
  return out;
}

function argument(s: string, p: Cursor): Node {
  p.i++; // {
  const name = readUntil(s, p, ',}').trim();
  if (s[p.i] === '}') {
    p.i++;
    return { arg: name, type: 'simple' };
  }
  p.i++; // ,
  const type = readUntil(s, p, ',}').trim();
  if (type !== 'plural' && type !== 'select') {
    // {n, number} and {n, number, percent}: formatted as a number
    readUntil(s, p, '}');
    p.i++;
    return { arg: name, type: 'number' };
  }
  p.i++; // ,
  let offset = 0;
  const cases: Record<string, Node[]> = {};
  for (;;) {
    skipSpace(s, p);
    if (p.i >= s.length) throw new Error(`Unclosed {${name}, ${type}} in message: ${s}`);
    if (s[p.i] === '}') break;
    const selector = readUntil(s, p, ' \t\r\n{').trim();
    if (selector.startsWith('offset:')) {
      offset = Number(selector.slice(7));
      continue;
    }
    skipSpace(s, p);
    p.i++; // {
    cases[selector] = nodes(s, p, type === 'plural', true);
    p.i++; // }
  }
  p.i++; // closing } of the argument
  return { arg: name, type: type as 'plural' | 'select', offset, cases } as Node;
}

function readUntil(s: string, p: Cursor, stops: string): string {
  const start = p.i;
  while (p.i < s.length && !stops.includes(s[p.i])) p.i++;
  return s.slice(start, p.i);
}

function skipSpace(s: string, p: Cursor) {
  while (p.i < s.length && /\s/.test(s[p.i])) p.i++;
}

/** Fills a message with `params`. A placeholder with no value stays visible as `{name}`. */
export function format(source: string, locale: string, params: Params = {}): string {
  return render(parse(source), locale, params, 0);
}

function render(list: Node[], locale: string, params: Params, hash: number): string {
  let out = '';
  for (const node of list) {
    if (typeof node === 'string') out += node;
    else if ('hash' in node) out += numberFormat(locale).format(hash);
    else {
      const value = params[node.arg];
      if (value === undefined) out += `{${node.arg}}`;
      else if (node.type === 'simple') out += String(value);
      else if (node.type === 'number') out += numberFormat(locale).format(Number(value));
      else if (node.type === 'select') {
        const branch = node.cases[String(value)] ?? node.cases.other;
        if (branch) out += render(branch, locale, params, hash);
      } else {
        const n = Number(value) - node.offset;
        const branch = node.cases[`=${Number(value)}`] ?? node.cases[pluralRules(locale).select(n)] ?? node.cases.other;
        if (branch) out += render(branch, locale, params, n);
      }
    }
  }
  return out;
}
