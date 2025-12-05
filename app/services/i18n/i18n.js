var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { PersistentStatefulService } from '../core/persistent-stateful-service';
import { mutation } from 'services/core/stateful-service';
import { Inject } from '../core/injector';
import * as obs from '../../../obs-api';
import * as fs from 'fs';
import path from 'path';
import fallback from '../../i18n/fallback';
import * as remote from '@electron/remote';
export function $t(...args) {
    const vueI18nInstance = I18nService.vueI18nInstance;
    return vueI18nInstance.t.call(I18nService.vueI18nInstance, ...args);
}
function $te(...args) {
    const vueI18nInstance = I18nService.vueI18nInstance;
    return vueI18nInstance.te.call(I18nService.vueI18nInstance, ...args);
}
export function $translateIfExist(...args) {
    return $t(...args);
}
export function $translateIfExistWithCheck(key, ...args) {
    return $te(key) ? $t(key, ...args) : key;
}
const LANG_CODE_MAP = {
    cs: { lang: 'Czech', locale: 'cs-CZ' },
    de: { lang: 'German', locale: 'de-DE' },
    'en-US': { lang: 'English', locale: 'en-US' },
    es: { lang: 'Spanish', locale: 'es-ES' },
    fr: { lang: 'French', locale: 'fr-FR' },
    it: { lang: 'Italian', locale: 'it-IT' },
    ja: { lang: 'Japanese', locale: 'ja-JP' },
    ko: { lang: 'Korean', locale: 'ko-KR' },
    pl: { lang: 'Polish', locale: 'pl-PL' },
    pt: { lang: 'Portuguese', locale: 'pt-PT' },
    'pt-BR': { lang: 'Portuguese (Brazil)', locale: 'pt-BR' },
    ru: { lang: 'Russian', locale: 'ru-RU' },
    sk: { lang: 'Slovak', locale: 'sk-SK' },
    th: { lang: 'Thai', locale: 'th-TH' },
    tr: { lang: 'Turkish', locale: 'tr-TR' },
    'zh-CN': { lang: 'Chinese (Simplified)', locale: 'zh-CN' },
};
export const WHITE_LIST = [
    'en-US',
    'ru-RU',
    'zh-TW',
    'da-DK',
    'de-DE',
    'hu-HU',
    'it-IT',
    'ja-JP',
    'ko-KR',
    'pl-PL',
    'pt-PT',
    'pt-BR',
    'es-ES',
    'fr-FR',
    'tr-TR',
];
export class I18nService extends PersistentStatefulService {
    constructor() {
        super(...arguments);
        this.availableLocales = {};
        this.loadedDictionaries = {};
        this.isLoaded = false;
    }
    static setVuei18nInstance(instance) {
        I18nService.vueI18nInstance = instance;
    }
    static setBrowserViewLocale(view) {
        if (!view)
            return;
        const i18nService = I18nService.instance;
        const locale = i18nService.state.locale.toLowerCase();
        view.webContents.on('dom-ready', () => {
            view.webContents.executeJavaScript(`
        const getCookie = (name) => {
          let value = "; " + document.cookie;
          let parts = value.split("; " + name + "=");
          if (parts.length === 2) return parts.pop().split(";").shift();
        };

        const setCookie = (name, value) => {
          document.cookie = name + "=" + (value || "") + "; path=/";
        };

        const langCode = getCookie('langCode');

        if (!(new RegExp('${locale}', 'i').test(langCode))) {
          // Detect the proper format and set the cookie to Desktop's locale
          const isUpper = x => x.toUpperCase() === x;
          const splitLocale = l => l.split('-');
          const [lang, code] = splitLocale(langCode || '');
          const usesUpperCode = code && isUpper(code[0]);
          const [newLang, newCode] = splitLocale('${locale}');
          const localeToSet = [newLang, (usesUpperCode ? newCode.toUpperCase() : newCode)].join('-');

          setCookie('langCode', localeToSet);
          window.location.reload();
        }
      `);
        });
    }
    static uploadTranslationsToVueI18n() {
        return __awaiter(this, arguments, void 0, function* (async = false) {
            const vueI18nInstance = I18nService.vueI18nInstance;
            const i18nService = I18nService.instance;
            const dictionaries = async
                ? yield i18nService.actions.return.getLoadedDictionaries()
                : i18nService.getLoadedDictionaries();
            Object.keys(dictionaries).forEach(locale => {
                I18nService.vueI18nInstance.setLocaleMessage(locale, dictionaries[locale]);
            });
            vueI18nInstance.locale = i18nService.state.locale;
            vueI18nInstance.fallbackLocale = async
                ? yield i18nService.actions.return.getFallbackLocale()
                : i18nService.getFallbackLocale();
        });
    }
    load() {
        if (this.isLoaded)
            return;
        const i18nPath = this.getI18nPath();
        const localeFiles = fs.readdirSync(i18nPath);
        for (const locale of localeFiles) {
            if (!this.localeIsSupported(locale))
                continue;
            this.availableLocales[locale] = this.fileManagerService.read(`${i18nPath}/${locale}/langname.txt`);
        }
        let locale = this.state.locale;
        if (!locale) {
            const electronLocale = remote.app.getLocale();
            const langDescription = LANG_CODE_MAP[electronLocale];
            locale = langDescription ? langDescription.locale : 'en-US';
        }
        const fallbackLocale = this.getFallbackLocale();
        if (!this.localeIsSupported(locale))
            locale = fallbackLocale;
        if (!this.loadedDictionaries[locale]) {
            this.loadDictionary(locale);
        }
        if (!this.loadedDictionaries[fallbackLocale]) {
            this.loadDictionary(fallbackLocale);
        }
        obs.Global.locale = locale;
        this.SET_LOCALE(locale);
        const localeList = Object.keys(this.availableLocales).map(locale => {
            return {
                value: locale,
                label: this.availableLocales[locale],
            };
        });
        this.SET_LOCALE_LIST(localeList);
        I18nService.uploadTranslationsToVueI18n();
        this.isLoaded = true;
    }
    getFallbackLocale() {
        return 'en-US';
    }
    getLoadedDictionaries() {
        return this.loadedDictionaries;
    }
    setLocale(locale) {
        this.SET_LOCALE(locale);
        remote.session.defaultSession.flushStorageData();
        remote.app.relaunch({ args: [] });
        remote.app.quit();
    }
    getI18nPath() {
        return path.join(remote.app.getAppPath(), 'app/i18n');
    }
    loadDictionary(locale) {
        if (this.loadedDictionaries[locale])
            return this.loadedDictionaries[locale];
        if (locale === 'en-US') {
            this.loadedDictionaries['en-US'] = fallback;
            return fallback;
        }
        const i18nPath = this.getI18nPath();
        const dictionaryFiles = fs
            .readdirSync(`${i18nPath}/${locale}`)
            .filter(fileName => fileName.split('.')[1] === 'json');
        const dictionary = {};
        for (const fileName of dictionaryFiles) {
            const filePath = `${i18nPath}/${locale}/${fileName}`;
            let json;
            try {
                json = JSON.parse(this.fileManagerService.read(filePath));
            }
            catch (e) {
                throw new Error(`Invalid JSON in ${filePath}`);
            }
            Object.assign(dictionary, json);
        }
        this.loadedDictionaries[locale] = dictionary;
        return dictionary;
    }
    localeIsSupported(locale) {
        return WHITE_LIST.includes(locale) && fs.existsSync(`${this.getI18nPath()}/${locale}`);
    }
    SET_LOCALE(locale) {
        this.state.locale = locale;
    }
    SET_LOCALE_LIST(list) {
        this.state.localeList = list;
    }
}
I18nService.defaultState = {
    locale: '',
    localeList: [],
};
__decorate([
    Inject()
], I18nService.prototype, "fileManagerService", void 0);
__decorate([
    mutation()
], I18nService.prototype, "SET_LOCALE", null);
__decorate([
    mutation()
], I18nService.prototype, "SET_LOCALE_LIST", null);
//# sourceMappingURL=i18n.js.map