import { Component, untracked } from '@motifx/core';
import { I18n } from '../createI18n';
import type { Params } from '../types';

export interface TransProps {
  /** Message key. */
  k: string;
  /** Placeholder values; pass a getter (`() => ({ n: state.n })`) to follow reactive data. */
  params?: Params | (() => Params);
  /** One entry per `<tag>text</tag>` in the message; receives the inner text, returns a component. */
  slots?: Record<string, (text: string) => Component<any, any>>;
  /** Translation state. Left out, it is resolved from DI (`addSingleton(I18n, { useValue: i18n })`). */
  i18n?: I18n<any>;
}

const TAG = /<(\w+)>(.*?)<\/\1>/gs;

/**
 * Renders a message that holds components, such as a link inside a sentence. The message marks the
 * spots with tags and `slots` says what each tag becomes. Tags do not nest. It follows the locale.
 *
 * @example
 * // "terms": "I accept the <link>terms of use</link>"
 * <Trans k="terms" slots={{ link: (text) => <a href="/terms">{text}</a> }} />
 */
export class Trans extends Component<HTMLSpanElement, TransProps> {
  override onBuilt() {
    const i18n = this.props.i18n ?? this.getService(I18n);
    if (!i18n) throw new Error('Trans: pass `i18n` or register I18n in DI');
    this.bindings.watch(() => {
      const p = this.props.params;
      const text = i18n.t(this.props.k, typeof p === 'function' ? p() : p);
      // Building slot components must not make the watcher depend on what their templates read.
      untracked(() => this.paint(text));
    });
  }

  private paint(text: string) {
    this.controls.clear();
    // ControlCollection.add accepts strings at runtime, its typings only list components and an index
    const add = (part: string | Component<any, any>) => (this.controls as any).add(part);
    const slots = this.props.slots ?? {};
    let last = 0;
    for (const m of text.matchAll(TAG)) {
      if (m.index > last) add(text.slice(last, m.index));
      const slot = slots[m[1]];
      add(slot ? slot(m[2]) : m[2]);
      last = m.index + m[0].length;
    }
    if (last < text.length) add(text.slice(last));
  }
}
