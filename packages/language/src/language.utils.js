"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeLanguageCode = normalizeLanguageCode;
exports.formatLanguageLabel = formatLanguageLabel;
const language_registry_1 = require("./language.registry");
function normalizeLanguageCode(rawCode) {
    if (!rawCode)
        return 'en';
    const clean = rawCode.trim().toLowerCase().split('-')[0];
    return language_registry_1.LanguageRegistry.isValidCode(clean) ? clean : 'en';
}
function formatLanguageLabel(code) {
    const lang = language_registry_1.LanguageRegistry.getByCode(code);
    return `${lang.nativeName} (${lang.name})`;
}
