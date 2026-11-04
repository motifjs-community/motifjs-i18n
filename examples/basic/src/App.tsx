import { Component, reactive } from '@motifx/core';
import { Trans } from '@motifx-community/i18n';
import { d, i18n, locales, n, rt, setLocale, t } from './i18n';

export class App extends Component<HTMLDivElement> {
  state = reactive({ name: '', count: 2 });
  private opened = new Date();

  override view() {
    return (
      <div class="app">
        <div class="bar">
          <h1>{() => t('title')}</h1>
          <div class="langs">
            {locales.map((l) => (
              <button key={l.code} class={() => ({ 'is-active': i18n.locale === l.code })} onclick={() => setLocale(l.code)}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div class="card">
          <p>{() => t('greeting', { name: this.state.name || t('namePlaceholder') })}</p>
          <label class="muted">{() => t('nameLabel')}</label>
          <input x-model={() => this.state.name} placeholder={() => t('namePlaceholder')} />
        </div>

        <div class="card">
          <p>{() => t('cart.items', { count: this.state.count })}</p>
          <div class="row">
            <button title={() => t('cart.remove')} onclick={() => this.state.count > 0 && this.state.count--}>-</button>
            <button title={() => t('cart.add')} onclick={() => this.state.count++}>+</button>
          </div>
        </div>

        <div class="card">
          <p>{() => t('today', { date: d(this.opened, 'full') })}</p>
          <p>{() => t('price', { price: n(1234.5, 'price') })}</p>
          <p class="muted">{() => t('updated', { when: rt(-3, 'hour') })}</p>
          <p>
            <Trans k="terms" slots={{ link: (text) => <a href="#terms">{text}</a> }} />
          </p>
          <p class="muted">{() => (i18n.loading ? t('loading') : '')}</p>
        </div>
      </div>
    );
  }
}
