import { Application, Component } from '@motifx/core';
import { afterEach, describe, expect, it } from 'vitest';
import { createI18n, I18n, Trans } from '../src';

const tick = () => Promise.resolve();
const make = () =>
  createI18n({
    locale: 'en',
    messages: {
      en: { hi: 'Hello', tip: 'Tooltip', terms: 'I accept the <link>terms</link> today' },
      tr: { hi: 'Merhaba', tip: 'İpucu', terms: '<link>Şartları</link> kabul ediyorum' },
      ar: { hi: 'مرحبا', tip: 'تلميح', terms: 'أقبل <link>الشروط</link>' },
    },
  });

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('dir');
});

describe('bound text', () => {
  it('50 bindings and an attribute follow the locale with no rebuild, and html lang/dir follow too', async () => {
    const i18n = make();
    const { t } = i18n;
    class Page extends Component<HTMLDivElement> {
      override view() {
        return (
          <div>
            <button title={() => t('tip')}>x</button>
            {Array.from({ length: 50 }, (_, i) => ({ id: i })).map((row) => (
              <p key={row.id}>{() => `${t('hi')} ${row.id}`}</p>
            ))}
          </div>
        );
      }
    }
    const page = new Page();
    page.build();
    document.body.appendChild(page.element as Node);
    const first = page.element.querySelector('p');
    expect(page.element.querySelectorAll('p')).toHaveLength(50);
    expect(first?.textContent).toBe('Hello 0');
    expect(page.element.querySelector('button')?.getAttribute('title')).toBe('Tooltip');

    await i18n.setLocale('tr');
    await tick();
    expect(page.element.querySelector('p')).toBe(first); // same node, text patched in place
    expect([...page.element.querySelectorAll('p')].every((p, i) => p.textContent === `Merhaba ${i}`)).toBe(true);
    expect(page.element.querySelector('button')?.getAttribute('title')).toBe('İpucu');
    expect(document.documentElement.lang).toBe('tr');
    expect(document.documentElement.dir).toBe('ltr');

    await i18n.setLocale('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(i18n.dir).toBe('rtl');
    await page.dispose();
  });
});

describe('Trans', () => {
  it('puts a component into the sentence and follows the locale; I18n comes from DI', async () => {
    const i18n = make();
    const builder = Application.CreateBuilder();
    builder.services.addSingleton(I18n, { useValue: i18n });
    const app = builder.build();
    const trans = new Trans({ k: 'terms', slots: { link: (text) => <a href="/terms">{text}</a> } });
    trans.build();
    document.body.appendChild(trans.element as Node);
    await tick();
    expect(trans.element.textContent).toBe('I accept the terms today');
    expect(trans.element.querySelector('a')?.textContent).toBe('terms');

    await i18n.setLocale('tr');
    await tick();
    expect(trans.element.textContent).toBe('Şartları kabul ediyorum');
    expect(trans.element.querySelectorAll('a')).toHaveLength(1);
    await trans.dispose();
    await app.dispose();
  });
});
