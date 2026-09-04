"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageRegistry = void 0;
const supported_languages_1 = require("./supported-languages");
class LanguageRegistry {
    static getAll() {
        return supported_languages_1.SUPPORTED_LANGUAGES;
    }
    static getByCode(code) {
        return supported_languages_1.LANGUAGE_MAP[code] || supported_languages_1.LANGUAGE_MAP['en'];
    }
    static isValidCode(code) {
        return code in supported_languages_1.LANGUAGE_MAP;
    }
    static getLocale(code) {
        return this.getByCode(code).locale;
    }
    static getFallback(code) {
        return this.getByCode(code).fallback;
    }
}
exports.LanguageRegistry = LanguageRegistry;
