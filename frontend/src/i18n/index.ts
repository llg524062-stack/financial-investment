/** i18n scaffold — integrate react-i18next when needed */
export type Locale = 'zh-CN' | 'en-US';

const messages: Record<Locale, Record<string, string>> = {
  'zh-CN': {
    'app.title': 'gll-金融投资指挥中台',
    'login.title': '登录',
  },
  'en-US': {
    'app.title': 'GLL Financial Command Center',
    'login.title': 'Sign In',
  },
};

let currentLocale: Locale = 'zh-CN';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function t(key: string): string {
  return messages[currentLocale][key] ?? key;
}

export function getLocale(): Locale {
  return currentLocale;
}
