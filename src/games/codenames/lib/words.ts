import type { Lang } from './i18n';
import { WORDS_KO } from './words-ko';
import { WORDS_EN } from './words-en';
import { WORDS_ZH } from './words-zh';
import { WORDS_JW_KO } from './words-jw-ko';
import { WORDS_JW_EN } from './words-jw-en';
import { WORDS_JW_ZH } from './words-jw-zh';

export type WordPack = 'standard' | 'jw';

export function getWords(lang: Lang, pack: WordPack = 'standard'): string[] {
  let words: string[];
  if (pack === 'jw') {
    switch (lang) {
      case 'ko': words = WORDS_JW_KO; break;
      case 'en': words = WORDS_JW_EN; break;
      case 'zh': words = WORDS_JW_ZH; break;
    }
  } else {
    switch (lang) {
      case 'ko': words = WORDS_KO; break;
      case 'en': words = WORDS_EN; break;
      case 'zh': words = WORDS_ZH; break;
    }
  }
  return [...new Set(words)];
}
