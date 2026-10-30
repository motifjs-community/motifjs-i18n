import { Application } from '@motifx/core';
import { I18n } from '@motifx-community/i18n';
import { i18n } from './i18n';
import { App } from './App';

const builder = Application.CreateBuilder();
// Registered so <Trans> finds it without a prop.
builder.services.addSingleton(I18n, { useValue: i18n });
const app = builder.build();

app.run('#app', new App());
