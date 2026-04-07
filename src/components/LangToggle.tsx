import type { Lang } from '../games/codenames/lib/i18n';
import { sfxClick } from '../lib/sound';

const LANG_NAMES: Record<Lang, string> = {
  ko: '한국어',
  en: 'English',
  zh: '中文',
};

interface LangToggleProps {
  lang: Lang;
  onChange: (lang: Lang) => void;
}

export default function LangToggle({ lang, onChange }: LangToggleProps) {
  return (
    <div className="flex gap-0.5 bg-stone-200 rounded-lg p-0.5" role="group" aria-label="언어 선택">
      {(['ko', 'en', 'zh'] as const).map((l) => (
        <button
          key={l}
          onClick={() => { sfxClick(); onChange(l); }}
          aria-label={LANG_NAMES[l]}
          aria-pressed={lang === l}
          className={`px-2 py-1 rounded-md text-xs font-black transition-all ${
            lang === l ? 'bg-white text-stone-800 shadow' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
